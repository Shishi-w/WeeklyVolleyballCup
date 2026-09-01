'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteCosObjects } from '@/lib/actions/upload';

export type TimelineFilter = 'all' | 'recent' | 'history';

export interface MatchInput {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
}

function validateMatchInput(input: MatchInput): void {
  if (!input.name?.trim()) throw new Error('周赛名称不能为空');
  if (!input.start_date || !input.end_date) throw new Error('请填写开始和结束时间');
  if (new Date(input.end_date) <= new Date(input.start_date)) {
    throw new Error('结束时间必须晚于开始时间');
  }
}

function extractCosKey(url: string): string | null {
  const prefix = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (prefix && url.startsWith(prefix)) {
    return url.slice(prefix.length).replace(/^\//, '');
  }
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

export async function listMatches(filter: TimelineFilter = 'all') {
  const params: unknown[] = [];
  const clauses: string[] = [];

  if (filter === 'history') {
    clauses.push("status = 'completed'");
  } else if (filter === 'recent') {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    clauses.push('start_date >= $1::timestamptz');
    clauses.push('end_date <= $2::timestamptz');
    params.push(new Date(now - 7 * day).toISOString(), new Date(now + 7 * day).toISOString());
  }

  let sql = 'SELECT * FROM matches_with_status';
  if (clauses.length > 0) {
    sql += ' WHERE ' + clauses.join(' AND ');
  }
  sql += ' ORDER BY start_date DESC';

  const { rows } = await db.query(sql, params);
  return rows;
}

export async function getMatchById(id: string) {
  const { rows } = await db.query(
    'SELECT * FROM matches_with_status WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function createMatch(input: MatchInput): Promise<string> {
  await requireAdmin();
  validateMatchInput(input);
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO matches (id, name, description, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, input.name.trim(), input.description?.trim() || null, input.start_date, input.end_date]
  );
  return id;
}

export async function updateMatch(id: string, input: MatchInput): Promise<void> {
  await requireAdmin();
  validateMatchInput(input);
  await db.query(
    `UPDATE matches
     SET name = $1, description = $2, start_date = $3, end_date = $4, updated_at = now()
     WHERE id = $5`,
    [input.name.trim(), input.description?.trim() || null, input.start_date, input.end_date, id]
  );
}

export async function deleteMatch(id: string): Promise<void> {
  await requireAdmin();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT image_url FROM match_records WHERE match_id = $1',
      [id]
    );
    const keys = rows
      .map((r) => r.image_url as string)
      .filter(Boolean)
      .map(extractCosKey)
      .filter((k): k is string => Boolean(k));
    await client.query('DELETE FROM user_achievements WHERE match_id = $1', [id]);
    await client.query('DELETE FROM match_team_results WHERE match_id = $1', [id]);
    await client.query('DELETE FROM match_records WHERE match_id = $1', [id]);
    await client.query('DELETE FROM match_results WHERE match_id = $1', [id]);
    await client.query('DELETE FROM match_rules WHERE match_id = $1', [id]);
    await client.query('DELETE FROM match_themes WHERE match_id = $1', [id]);
    await client.query('DELETE FROM teams WHERE match_id = $1', [id]);
    await client.query('DELETE FROM matches WHERE id = $1', [id]);
    await client.query('COMMIT');
    if (keys.length > 0) {
      await deleteCosObjects(keys).catch((err) =>
        console.error('删除 COS 图片失败（忽略）:', err)
      );
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
