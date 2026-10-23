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

  const [
    skills,
    allApplications,
    pendingUsersCount
  ] = await Promise.all([
    // 1. Skills and supplies
    prisma.skill.findMany({
      include: { supplies: true },
      orderBy: { name: 'asc' }
    }),
    // 2. All applications for application management
    prisma.application.findMany({
      include: {
        representativeUser: true,
        slot: true,
        skills: { include: { skill: true } },
        participants: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    // 3. Count of users pending approval
    prisma.user.count({
      where: { approvalStatus: 'PENDING' }
    })
  ]);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '20px' }}>
          관리자
        </h1>

        <AdminDashboardClient 
          initialUsers={[]}
          initialParticipants={[]}
          initialSkills={skills}
          initialApplications={allApplications as any}
          pendingUsersCount={pendingUsersCount}
          assignmentNeedsUpdate={needsUpdate}
          selectedDate={new Date().toISOString().split('T')[0]}
        />
      </div>
    </main>
  );
}
