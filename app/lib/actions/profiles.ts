'use server';

import { db } from '@/lib/db';

export async function getProfileById(id: string) {
  const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function countProfiles(): Promise<number> {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM profiles');
  return rows[0]?.count ?? 0;
}

export async function listProfiles() {
  const { rows } = await db.query('SELECT * FROM profiles');
  return rows;
}

export async function listProfileSelect() {
  const { rows } = await db.query(
    'SELECT id, username, full_name FROM profiles ORDER BY username'
  );
  return rows;
}
