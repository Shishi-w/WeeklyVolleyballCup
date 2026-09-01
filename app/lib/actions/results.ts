'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { TeamResult } from '@/lib/types';

export async function listTeamResultsByMatch(matchId: string): Promise<TeamResult[]> {
  const { rows } = await db.query(
    `SELECT r.*, t.team_name, t.captain_name, t.players
     FROM match_team_results r
     LEFT JOIN teams t ON t.id = r.team_id
     WHERE r.match_id = $1
     ORDER BY r.rank ASC`,
    [matchId]
  );
  return rows.map(({ team_name, captain_name, players, ...rest }) => ({
    ...rest,
    teams: team_name ? { team_name, captain_name, players } : null,
  }));
}

export async function getExistingTeamResults(matchId: string): Promise<TeamResult[]> {
  const { rows } = await db.query(
    'SELECT * FROM match_team_results WHERE match_id = $1',
    [matchId]
  );
  return rows;
}

export async function listUserTeamResults(teamIds: string[]): Promise<TeamResult[]> {
  if (teamIds.length === 0) return [];
  const { rows } = await db.query(
    `SELECT r.*, m.id AS m_id, m.name AS m_name, m.start_date AS m_start_date, t.team_name
     FROM match_team_results r
     LEFT JOIN matches m ON m.id = r.match_id
     LEFT JOIN teams t ON t.id = r.team_id
     WHERE r.team_id = ANY($1)
     ORDER BY r.created_at DESC`,
    [teamIds]
  );
  return rows.map(({ m_id, m_name, m_start_date, team_name, ...rest }) => ({
    ...rest,
    matches: m_id ? { id: m_id, name: m_name, start_date: m_start_date } : null,
    teams: team_name ? { team_name } : null,
  }));
}

export async function upsertTeamResults(
  matchId: string,
  results: { team_id: string; rank: number }[]
): Promise<void> {
  await requireUser();
  for (const r of results) {
    await db.query(
      `INSERT INTO match_team_results (match_id, team_id, rank, is_winner)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id, team_id)
       DO UPDATE SET rank = EXCLUDED.rank, is_winner = EXCLUDED.is_winner`,
      [matchId, r.team_id, r.rank, r.rank === 1]
    );
  }
}
