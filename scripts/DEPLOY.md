# 部署与迁移手册（腾讯云 Lighthouse + 自建 Postgres + COS）

本文档把迁移拆成可回滚的阶段。核心原则：**新旧并行**，Vercel + Supabase 一直跑着，直到腾讯云版本全量验证通过，再用 DNS 切过去。

> 配套脚本：`scripts/download-images.mjs`（备份图片）、`scripts/schema-migration.sql`（schema 迁移）。

---

## 阶段 A — 备份（在能连上 Supabase 的机器上执行）

数据安全第一，动手前先备份。

### A1 数据库

Supabase 控制台 → Database → Connection string → 直连（port 5432），先重置一次数据库密码并记下。然后：

```bash
# public schema（含所有业务表、视图、外键、数据）
pg_dump -h <db-host> -p 5432 -U postgres.<ref> -d postgres \
  -Fc -f supabase_public.dump --schema=public

# auth.users（登录凭据，注意：这个表被授权给 supabase_auth_admin 角色，
# 用 postgres 主账号 dump 会报错，需按 Supabase 文档用 SQL 查询导出，见 A2 补充）
```

### A2 auth.users 导出（重要）

`auth.users` 不能被主账号直接 dump。在 Supabase 控制台 **SQL Editor** 里执行，导出为 CSV（或直接看下一条 SQL 的输出）：

```sql
-- 1) 先确认密码哈希格式（决定老账号是否需要重置密码）
SELECT id, email, encrypted_password, created_at,
       raw_user_meta_data->>'username' AS username
FROM auth.users LIMIT 5;

-- 2) 全量导出（在 SQL Editor 里点击 Export 存成 CSV）
SELECT id, email, encrypted_password,
       raw_user_meta_data->>'username' AS username,
       created_at
FROM auth.users;
```

**关键判断**：若 `encrypted_password` 前缀是 `$2a$` / `$2b$` / `$2y$`（bcrypt），`bcryptjs` 可直接校验，老账号免重置；若为 `$argon2*`，老账号需重置密码（新代码注册的用户仍是 bcrypt）。

### A3 图片备份

在项目目录执行（会提示输入 Supabase URL 与 anon key，或走环境变量）：

```bash
node scripts/download-images.mjs ./images-out
```

脚本会打印文件总数并下载到 `./images-out/`，请记录总数，迁移后对账用。

---

## 阶段 B — Lighthouse 服务器环境

SSH 登录服务器（Lighthouse 默认用户 `lighthouse`，可 sudo）：

```bash
# 系统更新 + 基础工具
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl

# Node.js 22 LTS（Next 16 要求 Node >= 20.9）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # 应为 v22.x

# PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib
psql --version

# Nginx
sudo apt install -y nginx

# PM2
sudo npm i -g pm2

# 防火墙放行 80/443
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

---

## 阶段 C — 数据库迁移

### C1 建库并恢复

```bash
# 建用户与库
sudo -u postgres createuser --login --pwprompt wvc      # 输入一个强密码
sudo -u postgres createdb -O wvc wvc
# 让本机连接可用（可选，测试时用）
sudo -u postgres psql -c "ALTER USER wvc PASSWORD '<强密码>';"

# 先把 sql 上传到服务器（scp / git clone 均可），再恢复
# 恢复前先建一个 auth.uid() 桩函数，让 public 里引用 auth.uid() 的对象能恢复成功
sudo -u postgres psql -d wvc <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
SQL

# 恢复 public schema。若因引用 auth.users 的触发器/函数报错，属预期，忽略并继续
# （schema-migration.sql 第 5 步会级联清理这些对象）
pg_restore -d wvc -O --no-owner --schema=public supabase_public.dump
```

### C2 执行 schema 迁移

```bash
sudo -u postgres psql -d wvc -f schema-migration.sql
```

该脚本完成：密码格式检查 → 建 `users` 表并合并 `auth.users + profiles` 数据 → `profiles` 表改视图 → 重建 `matches_with_status` 视图 → 补齐 `match_team_results` 唯一约束 → 清理 RLS 与 auth/storage/realtime schema。

完成后用 `\dt` / `\dv` 检查：

```bash
sudo -u postgres psql -d wvc
\dt    # 应看到 users, teams, matches, match_themes, match_rules,
       # match_results, match_records, match_team_results, user_achievements, announcements
\dv    # 应看到 profiles, matches_with_status
SELECT count(*) FROM users;
SELECT count(*) FROM profiles;   -- 与 users 行数一致
```

### C3 配置数据库连接

```bash
# DATABASE_URL 示例（wvc 用户密码改为上面的强密码）
# postgresql://wvc:<强密码>@127.0.0.1:5432/wvc
```

> 建议用 `127.0.0.1` 而不是 `localhost`，避免 Socket vs TCP 差异。若用腾讯云 CDB 而非本机自建，需把 host 换成 CDB 内网地址并 `DATABASE_SSL=true`。

---

## 阶段 D — 代码上传与构建

```bash
# 在服务器上任意目录
mkdir -p /var/www && cd /var/www
git clone <你的仓库> WeeklyVolleyballCup && cd WeeklyVolleyballCup

# 生产环境变量（把下面这些按真实值填进去）
cat > .env.production <<'EOF'
DATABASE_URL=postgresql://wvc:<强密码>@127.0.0.1:5432/wvc
DATABASE_SSL=false
AUTH_SECRET=<与本地一致的随机串，或服务器上新生成 openssl rand -hex 32>
COS_SECRET_ID=<你的 SecretId>
COS_SECRET_KEY=<你的 SecretKey>
COS_BUCKET=<bucket 名，不含 appid 后缀>
COS_REGION=ap-guangzhou
NEXT_PUBLIC_IMAGE_BASE_URL=https://<bucket>-<appid>.cos.ap-guangzhou.myqcloud.com
EOF

# 安装并构建
npm ci
npm run build
```

> Next 16 的 `output: 'standalone'` 产物在 `.next/standalone`。若构建报错，多半是环境变量缺失（如 `NEXT_PUBLIC_IMAGE_BASE_URL`），检查 `.env.production`。

---

## 阶段 E — PM2 + Nginx + HTTPS

### E1 启动服务

```bash
# standalone 产物需要把 public 和 .next/static 拷过去。
# 注意：仓库已加 postbuild 脚本，npm run build 时会自动完成这两步复制。
# 若跳过 npm run build 直接拷贝产物，才需要手动执行：
# cp -r public .next/standalone/public 2>/dev/null || true
# cp -r .next/static .next/standalone/.next/static

pm2 start .next/standalone/server.js --name wvc
pm2 save
pm2 startup   # 按输出的提示执行它给出的那行命令，实现开机自启
```

> 若不需要 standalone，也可用 `pm2 start npm --name wvc -- start`。

### E2 Nginx 反代

```nginx
# /etc/nginx/sites-available/wvc
server {
  listen 80;
  server_name your-domain.com;      # 改成你的域名

  client_max_body_size 20m;         # 图片上传可能超过默认 1m

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wvc /etc/nginx/sites-enabled/wvc
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### E3 HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

（或用腾讯云免费 DV 证书手动配置，效果相同。）

---

## 阶段 F — COS 存储迁移

### F1 迁移存量图片

在腾讯云控制台创建 bucket（**公开读**），地域建议 `ap-guangzhou`。用 `coscmd` 或控制台把 `images-out/` 的文件上传到 `match-images/` 前缀：

```bash
# 安装 coscmd
pip install coscmd
coscmd config -a <SecretId> -s <SecretKey> -b <bucket>-<appid> -r ap-guangzhou
coscmd upload -rs ./images-out/ match-images/
```

### F2 改写已有 image_url

旧地址形如：`https://ygjfeaynthlbtmzmbabn.supabase.co/storage/v1/object/public/match-images/...`
新地址：`https://<bucket>-<appid>.cos.ap-guangzhou.myqcloud.com/match-images/...`

```sql
-- 在 wvc 库执行（域名换成你自己的，双引号包裹的字符串里注意反斜杠转义）
UPDATE match_records
SET image_url = replace(
  image_url,
  'https://<旧 supabase ref>.supabase.co/storage/v1/object/public/match-images/',
  'https://<bucket>-<appid>.cos.ap-guangzhou.myqcloud.com/match-images/'
)
WHERE image_url LIKE '%supabase.co/storage/v1/object/public/match-images/%';

SELECT count(*) FROM match_records WHERE image_url LIKE '%myqcloud.com%';  -- 对账
```

### F3 上传路径

新代码的 `uploadImage` server action 已用 `cos-nodejs-sdk-v5` 上传，无需额外操作。图片 URL 写入 `match_records.image_url`，前端经 `next/image` 显示（`next.config.mjs` 的 `remotePatterns` 已指向 COS 域名）。

---

## 阶段 G — 切换与验证

1. **验证（先在本机/服务器全走一遍）**：
   - 认证回归：老账号登录（验证 bcrypt 校验通过）→ 新用户注册 → 登出 → 刷新保持登录态。
   - 功能回归：首页公告、时间线列表、比赛详情页（主题/规则/结果/照片上传/评论/队伍/成就）。
   - 图片：上传新图 → COS 出现对象 → 前端正常显示；旧图 URL 改写后能加载。
   - 数据对账：`users`/`teams`/`match_records`/`user_achievements` 行数与 Supabase 一致；图片文件数一致。

2. **DNS 切换**：把域名 A 记录改指 Lighthouse 公网 IP，等生效后访问验证。

3. **确认无误后**：关停 Vercel 项目、删除 Supabase 项目（可再留一段时间确认）。

---

## 常见问题

- **pg_restore 报错 auth.users / auth.uid() 缺失**：预期内，见 C1 的桩函数说明，恢复后跑 schema-migration.sql 会清理。
- **老账号登录失败**：先跑 schema-migration.sql 第 0 步确认哈希前缀。若为 argon2，只能重置密码。
- **图片 403**：COS bucket 没开公开读，或 `remotePatterns` 域名没对上。
- **上传 500**：COS 密钥没配 / bucket 名写错（不含 appid 后缀）。
- **NEXT_PUBLIC_IMAGE_BASE_URL 影响构建**：构建机器也要配，否则 remotePatterns 落到占位符 `example.com`。
