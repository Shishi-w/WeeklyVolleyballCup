-- ============================================================
-- fix-missing-timestamps.sql — 修复业务表缺失的 created_at / updated_at
-- 背景：从 Supabase dump 恢复后，部分表没有 created_at / updated_at 列，
--       导致应用查询报错 "column created_at does not exist"（42703）。
-- 用法（在服务器上）：
--   sudo -u postgres psql -d wvc -f scripts/fix-missing-timestamps.sql
-- 幂等：可重复执行，不影响已有列。
-- ============================================================

BEGIN;

-- created_at：应用用 ORDER BY created_at 排序
ALTER TABLE match_themes       ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE match_records      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE teams              ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE match_team_results ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE user_achievements  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE announcements      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- updated_at：应用写 updated_at = now()
ALTER TABLE match_themes       ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE match_rules        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE match_results      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE match_records      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE announcements      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMIT;

-- ------------------------------------------------------------
-- 校验：以下应返回 0 行。若有剩余缺失，把表名列在最后一行
-- ------------------------------------------------------------
SELECT t.table_name,
       bool_and(c.column_name IN ('created_at', 'updated_at')) AS both_present
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = t.table_schema
 AND c.table_name = t.table_name
 AND c.column_name IN ('created_at', 'updated_at')
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'matches', 'teams', 'match_themes', 'match_rules', 'match_results',
    'match_records', 'match_team_results', 'user_achievements', 'announcements'
  )
GROUP BY t.table_name
HAVING NOT bool_and(c.column_name IN ('created_at', 'updated_at'))
   OR bool_and(c.column_name IS NULL);
