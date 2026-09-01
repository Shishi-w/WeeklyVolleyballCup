# 管理员权限设计

日期：2026-09-01
状态：已确认

## 背景

WeeklyVolleyballCup 目前没有管理员概念——所有登录用户都能编辑一切内容，且周赛（matches 表）没有任何增删改入口，只能手动改数据库。网站管理员（师师）需要一套管理员权限：管理周赛、登记赛果、编辑结果公示。

## 目标

1. 管理员可新建、编辑、删除周赛（含已结束周赛），可修改名称、描述、开始/结束时间。
2. 管理员可登记赛果（队伍排名 + 颁发荣誉），可编辑"赛事结果公示"文字。
3. 普通登录用户保持对主题、规则、队伍、图文记录（上传/编辑/删除/评论）的编辑权限。
4. 无权限的编辑控件一律不显示（不出现"🔒 登录后可编辑"之类的锁定占位按钮）。
5. 删除周赛时级联删除其全部关联数据。

## 需求澄清结论

- **管理员识别**：users 表新增 `role` 字段，值为 'admin' / 'user'（默认 'user'），首个管理员通过 SQL 手动设定。
- **管理员专属**：周赛增删改、登记赛果（队伍排名+荣誉）、赛事结果公示文字编辑。
- **普通登录用户开放**：本周主题、赛事规则、参赛队伍、图文记录。
- **按钮隐藏策略**：无权限一律不显示编辑按钮。
- **删除策略**：级联删除所有关联数据（队伍、图文记录、赛果、荣誉、主题/规则/结果文本）。
- **已结束周赛**：管理员可编辑/删除；登记赛果仍只在周赛 status='completed' 时开放。
- **首个管理员初始化**：提供 SQL 由管理员自行执行。

## 数据模型

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
-- 管理员自行执行（把邮箱换成自己的账号）
UPDATE users SET role = 'admin' WHERE email = '你的邮箱@example.com';
```

`profiles` 视图保持不变，不向公开用户列表暴露 role。

## 认证与会话（app/lib/auth.ts）

- `SessionUser` 增加 `role: 'admin' | 'user'`。
- JWT payload 携带 role；`verifySession()` 读取，缺失时默认 'user'。
- 新增 `requireAdmin()`：调用 `requireUser()` 后从数据库校验 `users.role = 'admin'`（权威校验、即时生效），否则抛错。

## 服务端 actions

### app/lib/actions/matches.ts（新增）
- `createMatch({ name, description, start_date, end_date })`：`requireAdmin()`，INSERT。
- `updateMatch(id, { name, description, start_date, end_date })`：`requireAdmin()`，UPDATE。
- `deleteMatch(id)`：`requireAdmin()`，事务内按外键依赖顺序级联删除：
  `user_achievements → match_team_results → match_records → match_results → match_rules → match_themes → teams → matches`；
  删除前收集 match_records 的 image_url，best-effort 调用 COS deleteObject 清理照片文件（失败不阻塞主流程）。

### app/lib/actions/matchContent.ts
- `saveResult()`：`requireUser()` 改为 `requireAdmin()`。
- `saveTheme()` / `saveRule()` 保持 `requireUser()`。

### app/lib/actions/results.ts
- `upsertTeamResults()`：`requireUser()` 改为 `requireAdmin()`。

### app/lib/actions/achievements.ts
- `upsertAchievement()`、`deleteAchievement()`：`requireUser()` 改为 `requireAdmin()`。

### 不变
- upload.ts、teams.ts、records.ts：仍开放给所有登录用户。

## UI 改动

### app/timeline/page.tsx
- 用 `getCurrentUser()` 判断 `role === 'admin'`。
- 管理员看到顶部"新建周赛"按钮 → CreateMatchModal（名称、描述、开始时间、结束时间，datetime-local）。
- 保存后刷新列表。

### app/match/[id]/page.tsx
- 引入 `isAdmin` 概念（基于 `getCurrentUser()` 返回的 role）。
- 顶部卡片：管理员看到"编辑周赛" / "删除周赛"按钮；删除用 confirm 明确提示"将永久删除该周赛及全部关联数据（队伍、照片、赛果、荣誉），不可恢复"。
- "记录比赛结果"按钮：显示条件 `isCompleted && canEdit` 改为 `isCompleted && isAdmin`。
- "编辑结果公示"按钮：显示条件 `isLoggedIn` 改为 `isAdmin`。
- 隐藏策略：未登录用户不再显示"🔒 登录后可编辑 / 可管理 / 上传照片"等锁定按钮；主题/规则编辑按钮仅 `isLoggedIn` 时显示；队伍编辑仅 `isLoggedIn` 时显示。
- 新增 EditMatchModal（复用 CreateMatchModal 的表单字段）。

## 校验与错误处理

- createMatch / updateMatch：名称非空、结束时间晚于开始时间，否则抛错。
- 非管理员直接调用管理员 action：服务端抛"无权限操作"，前端 catch 后 alert。

## 测试

- 提供 `scripts/admin-role.sql` 迁移脚本。
- 本地 dev server 实测：
  - 管理员：新建 → 编辑 → 删除周赛；登记赛果；编辑结果公示。
  - 普通账号：看不到周赛/赛果/结果公示编辑按钮，直接调用 action 被拒绝。
  - 未登录：看不到任何锁定按钮。
- `npm run build` 通过，无类型错误。

## 文件清单

| 文件 | 变更类型 |
|---|---|
| scripts/admin-role.sql | 新增 |
| app/lib/auth.ts | 修改（SessionUser.role、JWT、requireAdmin） |
| app/lib/actions/matches.ts | 修改（新增 CRUD） |
| app/lib/actions/matchContent.ts | 修改（saveResult 加管理员校验） |
| app/lib/actions/results.ts | 修改（upsertTeamResults 加管理员校验） |
| app/lib/actions/achievements.ts | 修改（upsert/delete 加管理员校验） |
| app/timeline/page.tsx | 修改（新建周赛按钮+弹窗） |
| app/match/[id]/page.tsx | 修改（编辑/删除周赛、权限按钮控制、隐藏锁定按钮） |
| docs/superpowers/specs/2026-09-01-admin-permissions-design.md | 本设计文档 |
