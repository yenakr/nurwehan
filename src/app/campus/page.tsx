import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import CampusClient from './CampusClient';

export default async function CampusPage() {
  const user = await getCurrentUser();

  const campusActivities = await prisma.campusActivity.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <CampusClient campusActivities={campusActivities} user={user} />
      </div>
    </main>
  );
}
