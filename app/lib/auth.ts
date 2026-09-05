import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const SESSION_COOKIE = 'wvc_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

export interface SessionUser {
  id: string;
  email: string;
  username: string | null;
  role: 'admin' | 'user';
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET 环境变量未设置');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      username: typeof payload.username === 'string' ? payload.username : null,
      role: payload.role === 'admin' ? 'admin' : 'user',
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('请先登录');
  }
  // 令牌只证明“登录过”；是否仍有效需查库，停用/删除后即使 JWT 未过期也不能继续操作
  const { rows } = await db.query(
    'SELECT email, username, role, deactivated_at FROM users WHERE id = $1',
    [user.id]
  );
  const row = rows[0];
  if (!row) {
    throw new Error('账号不存在');
  }
  if (row.deactivated_at) {
    throw new Error('该账号已停用');
  }
  return {
    id: user.id,
    email: row.email,
    username: row.username,
    role: row.role === 'admin' ? 'admin' : 'user',
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser(); // 已从库里取到最新 role
  if (user.role !== 'admin') {
    throw new Error('无权限操作');
  }
  return user;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}
