'use server';

import { db } from '@/lib/db';
import {
  getCurrentUser as _getCurrentUser,
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireUser,
} from '@/lib/auth';

export interface AuthResult {
  ok: boolean;
  code?: string;
  error?: string;
}

export async function getCurrentUser() {
  return _getCurrentUser();
}

export async function register(
  email: string,
  password: string,
  username: string
): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  if (!trimmedEmail || !password || !trimmedUsername) {
    return { ok: false, error: '请填写完整信息' };
  }
  if (password.length < 6) {
    return { ok: false, error: '密码长度至少为 6 位' };
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
  if (existing.rows.length > 0) {
    return { ok: false, code: 'email_exists', error: '该邮箱已被注册' };
  }

  const passwordHash = hashPassword(password);
  const id = crypto.randomUUID();
  await db.query(
    'INSERT INTO users (id, email, password_hash, username) VALUES ($1, $2, $3, $4)',
    [id, trimmedEmail, passwordHash, trimmedUsername]
  );
  return { ok: true };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const result = await db.query(
    'SELECT id, email, username, password_hash, role, deactivated_at FROM users WHERE email = $1',
    [trimmedEmail]
  );
  const user = result.rows[0];
  if (!user) {
    return { ok: false, code: 'user_not_found', error: '该用户不存在' };
  }
  if (!verifyPassword(password, user.password_hash)) {
    return { ok: false, code: 'invalid_credentials', error: '邮箱或密码错误' };
  }
  if (user.deactivated_at) {
    return { ok: false, code: 'account_deactivated', error: '该账号已停用，如需恢复请联系管理员' };
  }
  await setSessionCookie({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role === 'admin' ? 'admin' : 'user',
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}

export async function updateUsername(newUsername: string): Promise<AuthResult> {
  const user = await requireUser();
  const trimmed = newUsername.trim();
  if (!trimmed) {
    return { ok: false, error: '用户名不能为空' };
  }
  if (trimmed.length > 30) {
    return { ok: false, error: '用户名不能超过 30 个字符' };
  }
  const oldName = user.username;

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET username = $1 WHERE id = $2', [trimmed, user.id]);

    if (oldName && oldName !== trimmed) {
      // 历史署名同步（反规范化存的用户名文本）
      await client.query('UPDATE teams SET captain_name = $1 WHERE captain_name = $2', [trimmed, oldName]);
      await client.query('UPDATE announcements SET edited_by = $1 WHERE edited_by = $2', [trimmed, oldName]);
      await client.query(
        `UPDATE teams SET players = (
           SELECT jsonb_agg(
             CASE WHEN (p.value->>'user_id') = $1::text
                  THEN p.value || jsonb_build_object('name', $2::text)
                  ELSE p.value END
           )
           FROM jsonb_array_elements(teams.players) p
         )
         WHERE players @> jsonb_build_array(jsonb_build_object('user_id', $1::text))`,
        [user.id, trimmed]
      );
      // edited_by 列存邮箱，edited_by_username 存用户名
      await client.query('UPDATE match_records SET edited_by_username = $1 WHERE edited_by = $2', [trimmed, user.email]);
      await client.query('UPDATE match_themes  SET edited_by_username = $1 WHERE edited_by = $2', [trimmed, user.email]);
      await client.query('UPDATE match_rules   SET edited_by_username = $1 WHERE edited_by = $2', [trimmed, user.email]);
      await client.query('UPDATE match_results SET edited_by_username = $1 WHERE edited_by = $2', [trimmed, user.email]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // 会话里的用户名一起刷新，页面顶部昵称即时生效
  await setSessionCookie({ id: user.id, email: user.email, username: trimmed, role: user.role });
  return { ok: true };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  const user = await requireUser();
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: '新密码长度至少为 6 位' };
  }
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  const hash = rows[0]?.password_hash;
  if (!hash || !verifyPassword(currentPassword, hash)) {
    return { ok: false, error: '当前密码不正确' };
  }
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashPassword(newPassword), user.id]);
  await clearSessionCookie(); // 改密后退出重登
  return { ok: true };
}

export async function deactivateAccount(): Promise<AuthResult> {
  const user = await requireUser();
  if (user.role === 'admin') {
    return { ok: false, error: '管理员账号不能注销，请保留至少一个管理员' };
  }
  await db.query('UPDATE users SET deactivated_at = now() WHERE id = $1', [user.id]);
  await clearSessionCookie();
  return { ok: true };
}
