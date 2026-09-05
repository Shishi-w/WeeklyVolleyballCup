-- 账号设置功能迁移：users 增加软注销标记（deactivated_at 非空 = 账号已停用）
-- 用法：sudo -u postgres psql -d wvc -f scripts/account-settings.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
