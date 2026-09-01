-- ============================================================
-- admin-role.sql — 为 users 表增加管理员角色
-- 用法（服务器上执行）：
--   sudo -u postgres psql -d wvc -f scripts/admin-role.sql
-- 注意：把下面 UPDATE 的邮箱替换成你自己的账号邮箱。
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 将某个账号提升为管理员（替换邮箱后执行）
UPDATE users SET role = 'admin' WHERE email = '3330420998@qq.com';

-- 校验
SELECT id, email, username, role FROM users ORDER BY created_at;
