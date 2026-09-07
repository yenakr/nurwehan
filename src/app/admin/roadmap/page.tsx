import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminRoadmapClient from './AdminRoadmapClient';

export default async function AdminRoadmapPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    redirect('/login?redirect=/admin/roadmap');
  }

  const items = await prisma.roadmapItem.findMany({
    orderBy: [{ recommendedGrade: 'asc' }, { priority: 'asc' }],
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container">
        <AdminRoadmapClient initialItems={items} />
      </div>
    </main>
  );
}
