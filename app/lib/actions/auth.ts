'use server';

import { db } from '@/lib/db';
import {
  getCurrentUser as _getCurrentUser,
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
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
    'SELECT id, email, username, password_hash, role FROM users WHERE email = $1',
    [trimmedEmail]
  );
  const user = result.rows[0];
  if (!user) {
    return { ok: false, code: 'user_not_found', error: '该用户不存在' };
  }
  if (!verifyPassword(password, user.password_hash)) {
    return { ok: false, code: 'invalid_credentials', error: '邮箱或密码错误' };
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
