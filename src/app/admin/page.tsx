import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';
import { assignmentNeedsUpdate, purgeExpiredAssignments } from '@/lib/clinical';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/login?redirect=/admin');
  }

  await purgeExpiredAssignments();
  const needsUpdate = await assignmentNeedsUpdate();

  const pendingUsersCount = await prisma.user.count({
    where: { approvalStatus: 'PENDING' },
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '20px' }}>
          관리자
        </h1>

        <AdminDashboardClient
          pendingUsersCount={pendingUsersCount}
          assignmentNeedsUpdate={needsUpdate}
        />
      </div>
    </main>
  );
}
