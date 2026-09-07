import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import RoadmapClient from './RoadmapClient';

export default async function RoadmapPage() {
  const user = await getCurrentUser();

  const roadmapItems = await prisma.roadmapItem.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ recommendedGrade: 'asc' }, { priority: 'asc' }],
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <RoadmapClient initialItems={roadmapItems} user={user} />
      </div>
    </main>
  );
}
