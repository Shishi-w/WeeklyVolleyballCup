import { getCurrentUser } from '@/lib/auth';
import { listMatches } from '@/lib/actions/matches';
import TimelineClient from './TimelineClient';

export default async function TimelinePage() {
  const [user, matches] = await Promise.all([
    getCurrentUser(),
    listMatches('all'),
  ]);
  return <TimelineClient initialMatches={matches} currentUser={user} />;
}
