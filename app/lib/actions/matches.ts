'use server';

import { db } from '@/lib/db';

export type TimelineFilter = 'all' | 'recent' | 'history';

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
