'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function listRecords(matchId: string) {
  const { rows } = await db.query(
    'SELECT * FROM match_records WHERE match_id = $1 ORDER BY created_at DESC',
    [matchId]
  );
  return rows;
}

export async function createRecord(input: {
  match_id: string;
  image_url: string;
  caption: string;
}): Promise<void> {
  const user = await requireUser();
  await db.query(
    `INSERT INTO match_records (match_id, image_url, caption, edited_by, edited_by_username)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.match_id, input.image_url, input.caption ?? '', user.email || 'Anonymous', user.username || '匿名用户']
  );
}

export async function deleteRecord(id: string): Promise<void> {
  await requireUser();
  await db.query('DELETE FROM match_records WHERE id = $1', [id]);
}

export async function updateCaption(id: string, caption: string): Promise<void> {
  const user = await requireUser();
  await db.query(
    `UPDATE match_records
     SET caption = $1, edited_by = $2, edited_by_username = $3, updated_at = now()
     WHERE id = $4`,
    [caption, user.email || 'Anonymous', user.username || '匿名用户', id]
  );
}

export async function addComment(recordId: string, comment: string): Promise<void> {
  const user = await requireUser();
  const { rows } = await db.query(
    'SELECT comments FROM match_records WHERE id = $1',
    [recordId]
  );
  const current = rows[0]?.comments ?? [];
  const next = [...current, comment];
  await db.query(
    'UPDATE match_records SET comments = $1::jsonb, updated_at = now() WHERE id = $2',
    [JSON.stringify(next), recordId]
  );
}
