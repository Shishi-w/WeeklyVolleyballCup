-- ============================================================
-- schema-migration.sql — Supabase → 自建 Postgres 的 schema 迁移
-- 用法：在恢复完 supabase_public.dump 之后执行
--   sudo -u postgres psql -d wvc -f scripts/schema-migration.sql
--
-- 注意：这是一次性迁移脚本，请在备份完成后执行。
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0) 安全检查：确认 auth.users 密码哈希是 bcrypt（$2a$ / $2b$）
--    如果是 $argon2*，则 bcryptjs 无法校验，需要改为让用户重置密码。
--    执行后查看输出，若前缀不是 bcrypt，先停下处理再继续。
-- ------------------------------------------------------------
DO $$
DECLARE h text;
BEGIN
  SELECT encrypted_password INTO h FROM auth.users LIMIT 1;
  IF h IS NULL THEN
    RAISE NOTICE 'auth.users 为空，跳过密码格式检查';
  ELSIF h LIKE '$2a$%' OR h LIKE '$2b$%' OR h LIKE '$2y$%' THEN
    RAISE NOTICE '密码格式 OK：bcrypt（%）', left(h, 7);
  ELSE
    RAISE WARNING '密码格式异常，前缀为 % —— 老账号需要重置密码！', left(h, 8);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1) 创建 users 表（合并 auth.users + profiles）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,              -- 来自 auth.users.encrypted_password
  username      text,
  full_name     text,
  created_at    timestamptz DEFAULT now()
);

INSERT INTO users (id, email, password_hash, username, full_name, created_at)
SELECT
  u.id,
  u.email,
  u.encrypted_password,
  u.raw_user_meta_data->>'username',
  p.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id;

-- 校验：行数应与 auth.users 一致
DO $$
DECLARE u int; p int;
BEGIN
  SELECT count(*) INTO u FROM users;
  SELECT count(*) INTO p FROM auth.users;
  IF u <> p THEN
    RAISE WARNING 'users 行数 % 与 auth.users 行数 % 不一致，请人工核对！', u, p;
  ELSE
    RAISE NOTICE 'users 迁移完成：% 行', u;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) profiles 由表改为视图（单数据源：users）
--    先删除所有引用 profiles 的外键，否则无法 DROP TABLE。
-- ------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl
    FROM pg_constraint c
    WHERE c.contype = 'f' AND c.confrelid = 'profiles'::regclass
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    RAISE NOTICE '已删除外键 % on %（引用 profiles，改由 users 承载）', r.conname, r.tbl;
  END LOOP;
END $$;

-- 如需保留这些外键，可改为引用 users，例如（按实际列名调整）：
--   ALTER TABLE teams ADD CONSTRAINT teams_captain_fk FOREIGN KEY (captain_id) REFERENCES users(id);
--   ALTER TABLE user_achievements ADD CONSTRAINT ua_user_fk FOREIGN KEY (user_id) REFERENCES users(id);
--   ALTER TABLE match_team_results ADD CONSTRAINT mtr_team_fk FOREIGN KEY (team_id) REFERENCES teams(id);

DROP TABLE IF EXISTS profiles CASCADE;

CREATE VIEW profiles AS
SELECT id, username, full_name, created_at FROM users;

-- ------------------------------------------------------------
-- 3) 重建 matches_with_status 视图（status 由时间段计算）
--    若原 Supabase 视图定义不同，请以原定义为准核对。
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW matches_with_status AS
SELECT
  *,
  CASE
    WHEN now() < start_date                        THEN 'upcoming'
    WHEN now() BETWEEN start_date AND end_date     THEN 'ongoing'
    ELSE 'completed'
  END AS status
FROM matches;

-- ------------------------------------------------------------
-- 4) 确保 match_team_results 的唯一约束存在（upsert 依赖）
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'match_team_results_match_id_team_id_key'
      AND conrelid = 'match_team_results'::regclass
  ) THEN
    ALTER TABLE match_team_results
      ADD CONSTRAINT match_team_results_match_id_team_id_key UNIQUE (match_id, team_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5) 清理 Supabase 专属物：RLS、策略、schema
--    （应用以超级用户/owner 连接，绕过 RLS，且不再使用 auth 等 schema）
-- ------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

DROP SCHEMA IF EXISTS storage CASCADE;
DROP SCHEMA IF EXISTS realtime CASCADE;
DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
-- 最后再删 auth：其级联会顺带移除引用 auth.users 的触发器/函数（如 handle_new_user）
DROP SCHEMA IF EXISTS auth CASCADE;

COMMIT;
