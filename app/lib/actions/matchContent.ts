'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

type ContentTable = 'match_themes' | 'match_rules' | 'match_results';

interface SaveContentInput {
  matchId: string;
  id?: string | null;
  content: string;
}

async function saveContent(
  table: ContentTable,
  input: SaveContentInput
): Promise<void> {
  const user = await requireAdmin();
  const editedBy = user.email || 'Anonymous';
  const editedByUsername = user.username || '匿名用户';

  if (input.id) {
    await db.query(
      `UPDATE ${table} SET content = $1, edited_by = $2, edited_by_username = $3, updated_at = now() WHERE id = $4`,
      [input.content, editedBy, editedByUsername, input.id]
    );
  } else {
    await db.query(
      `INSERT INTO ${table} (match_id, content, edited_by, edited_by_username) VALUES ($1, $2, $3, $4)`,
      [input.matchId, input.content, editedBy, editedByUsername]
    );
  }
}

export async function getLatestTheme(matchId: string) {
  const { rows } = await db.query(
    'SELECT * FROM match_themes WHERE match_id = $1 ORDER BY created_at DESC LIMIT 1',
    [matchId]
  );
  return rows[0] ?? null;
}

export async function saveTheme(input: SaveContentInput): Promise<void> {
  await saveContent('match_themes', input);
}

export async function getRule(matchId: string) {
  const { rows } = await db.query('SELECT * FROM match_rules WHERE match_id = $1', [matchId]);
  return rows[0] ?? null;
}

export async function saveRule(input: SaveContentInput): Promise<void> {
  await saveContent('match_rules', input);
}

export async function getResult(matchId: string) {
  const { rows } = await db.query('SELECT * FROM match_results WHERE match_id = $1', [matchId]);
  return rows[0] ?? null;
}

export async function saveResult(input: SaveContentInput): Promise<void> {
  await saveContent('match_results', input);
}
