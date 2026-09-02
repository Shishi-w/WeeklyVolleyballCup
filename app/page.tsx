import { getCurrentUser } from '@/lib/auth';
import { listAnnouncements } from '@/lib/actions/announcements';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const [user, announcements] = await Promise.all([
    getCurrentUser(),
    listAnnouncements(),
  ]);
  return <HomeClient currentUser={user} initialAnnouncements={announcements} />;
}
