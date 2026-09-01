'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { Team, TeamPlayer } from '@/lib/types';

export async function listAllTeamsWithMatch(): Promise<Team[]> {
  const { rows } = await db.query(
    `SELECT t.*, m.id AS m_id, m.name AS m_name
     FROM teams t
     LEFT JOIN matches m ON m.id = t.match_id
     ORDER BY t.created_at DESC`
  );
  return rows.map(({ m_id, m_name, ...team }) => ({
    ...team,
    matches: m_id ? { id: m_id, name: m_name } : null,
  }));
}

export async function getTeamName(id: string): Promise<string | null> {
  const { rows } = await db.query('SELECT team_name FROM teams WHERE id = $1', [id]);
  return rows[0]?.team_name ?? null;
}

export async function listMatchTeams(matchId: string): Promise<Team[]> {
  const { rows } = await db.query(
    'SELECT * FROM teams WHERE match_id = $1 ORDER BY created_at ASC',
    [matchId]
  );
  return rows;
}

export async function createTeam(input: {
  team_name: string;
  captain_name: string;
  players: TeamPlayer[];
  match_id: string;
}): Promise<void> {
  await requireUser();
  await db.query(
    `INSERT INTO teams (team_name, captain_name, players, match_id)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [input.team_name, input.captain_name, JSON.stringify(input.players ?? []), input.match_id]
  );
}

export async function updateTeam(
  id: string,
  input: { team_name: string; captain_name: string; players: TeamPlayer[] }
): Promise<void> {
  await requireUser();
  await db.query(
    `UPDATE teams SET team_name = $1, captain_name = $2, players = $3::jsonb WHERE id = $4`,
    [input.team_name, input.captain_name, JSON.stringify(input.players ?? []), id]
  );
}

export async function deleteTeam(id: string): Promise<void> {
  await requireUser();
  await db.query('DELETE FROM teams WHERE id = $1', [id]);
}
