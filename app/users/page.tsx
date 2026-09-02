import { listProfiles } from '@/lib/actions/profiles';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const profiles = await listProfiles();
  return <UsersClient initialProfiles={profiles} />;
}
