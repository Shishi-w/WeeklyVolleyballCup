'use server';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { UserAchievement } from '@/lib/types';

export async function listUserAchievements(userId: string) {
  const { rows } = await db.query(
    'SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

export async function listMatchAchievements(matchId: string): Promise<UserAchievement[]> {
  const { rows } = await db.query(
    `SELECT a.*, t.team_name
     FROM user_achievements a
     LEFT JOIN teams t ON t.id = a.team_id
     WHERE a.match_id = $1`,
    [matchId]
  );
  return rows.map(({ team_name, ...rest }) => ({
    ...rest,
    teams: team_name ? { team_name } : null,
  }));
}

interface UpsertAchievementInput {
  id?: string | null;
  user_id: string;
  match_id: string;
  team_id?: string | null;
  achievement_type?: string;
  title: string;
  description?: string;
}

export async function upsertAchievement(input: UpsertAchievementInput): Promise<void> {
  await requireAdmin();
  const teamId = input.team_id || null;
  const type = input.achievement_type || 'participation';
  const description = input.description || '';

  if (input.id) {
    await db.query(
      `UPDATE user_achievements
       SET user_id = $1, match_id = $2, team_id = $3, achievement_type = $4,
           title = $5, description = $6
       WHERE id = $7`,
      [input.user_id, input.match_id, teamId, type, input.title, description, input.id]
    );
  } else {
    await db.query(
      `INSERT INTO user_achievements (user_id, match_id, team_id, achievement_type, title, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.user_id, input.match_id, teamId, type, input.title, description]
    );
  }
}

export async function deleteAchievement(id: string): Promise<void> {
  await requireAdmin();
  await db.query('DELETE FROM user_achievements WHERE id = $1', [id]);
}
