import { getCurrentUser } from '@/lib/auth';
import { getMatchById } from '@/lib/actions/matches';
import { getLatestTheme, getRule, getResult } from '@/lib/actions/matchContent';
import { listRecords } from '@/lib/actions/records';
import { listMatchTeams } from '@/lib/actions/teams';
import { listTeamResultsByMatch } from '@/lib/actions/results';
import { listMatchAchievements } from '@/lib/actions/achievements';
import Link from 'next/link';
import MatchDetailClient from './MatchDetailClient';

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user, match, theme, rule, result, records, teams, matchResults, achievements] =
    await Promise.all([
      getCurrentUser(),
      getMatchById(id),
      getLatestTheme(id),
      getRule(id),
      getResult(id),
      listRecords(id),
      listMatchTeams(id),
      listTeamResultsByMatch(id),
      listMatchAchievements(id),
    ]);

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600">赛事不存在</p>
          <Link href="/timeline" className="text-cyan-600 hover:text-cyan-700 hover:underline mt-4 block font-medium">
            返回时间轴
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MatchDetailClient
      matchId={id}
      currentUser={user}
      initialData={{ match, theme, rule, result, records, teams, matchResults, achievements }}
    />
  );
}
