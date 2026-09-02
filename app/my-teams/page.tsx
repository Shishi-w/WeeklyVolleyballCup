import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listAllTeamsWithMatch } from '@/lib/actions/teams';
import { listUserTeamResults } from '@/lib/actions/results';
import { listUserAchievements } from '@/lib/actions/achievements';
import MyTeamsClient from './MyTeamsClient';

export default async function MyTeamsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?callbackUrl=/my-teams');
  }

  const allTeams = await listAllTeamsWithMatch();

  const userTeams = (allTeams || []).filter((team) => {
    if (user.username && team.captain_name === user.username) return true;
    return (team.players ?? []).some((p) => p.user_id === user.id);
  });

  const teamIds = userTeams.map((t) => t.id);

  const [resultsData, achievementsData] = await Promise.all([
    teamIds.length > 0 ? listUserTeamResults(teamIds) : Promise.resolve([]),
    listUserAchievements(user.id),
  ]);

  const teams = userTeams.map((team) => {
    const isCaptain = !!user.username && team.captain_name === user.username;
    return {
      id: team.id,
      team_name: team.team_name,
      description: team.description ?? null,
      captain_name: team.captain_name,
      captain_id: team.captain_id ?? null,
      status: team.status ?? '',
      created_at: team.created_at,
      match_name: team.matches?.name ?? null,
      match_id: team.matches?.id ?? team.match_id,
      position: isCaptain ? '队长' : '队员',
      joined_at: team.created_at,
    };
  });

  const matchResults = (resultsData || []).map((r) => ({
    id: r.id,
    match_name: r.matches?.name ?? '',
    match_date: r.matches?.start_date ?? '',
    team_name: r.teams?.team_name ?? '',
    rank: r.rank,
    points: r.points ?? 0,
    is_winner: r.is_winner,
  }));

  const achievements = (achievementsData || []).map((a) => ({
    id: a.id,
    match_name: a.match_name ?? '',
    team_name: a.team_name ?? '',
    achievement_type: a.achievement_type,
    title: a.title,
    description: a.description ?? '',
    awarded_at: a.created_at ?? a.updated_at ?? '',
  }));

  return (
    <MyTeamsClient
      initialTeams={teams}
      initialMatchResults={matchResults}
      initialAchievements={achievements}
    />
  );
}
