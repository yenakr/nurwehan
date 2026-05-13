import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/login?redirect=/admin');
  }

  // Fetch initial data for dashboard
  const [
    pendingUsers,
    pendingApps,
    todayApps,
    skills,
    usageLogs
  ] = await Promise.all([
    // 1. Pending user registrations (top 5)
    prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),
    // 2. Pending OPEN LAB applications (top 5)
    prisma.application.findMany({
      where: { status: 'PENDING' },
      include: {
        representativeUser: true,
        slot: true,
        skills: { include: { skill: true } },
        participants: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),
    // 3. Today's approved applications
    prisma.application.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        slot: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      },
      include: {
        representativeUser: true,
        slot: true,
        skills: { include: { skill: true } },
        participants: true
      }
    }),
    // 4. Skills and supplies
    prisma.skill.findMany({
      include: { supplies: true },
      orderBy: { name: 'asc' }
    }),
    // 5. Recent usage logs
    prisma.usageLog.findMany({
      include: {
        application: {
          include: {
            representativeUser: true,
            slot: true
          }
        }
      },
      take: 10,
      orderBy: { submittedAt: 'desc' }
    })
  ]);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)' }}>
            관리자 통합 대시보드
          </h1>
          <p style={{ color: 'var(--sub-text)', marginTop: '8px' }}>
            {user.name}님, 오늘 하루도 수고 많으십니다.
          </p>
        </div>

        <AdminDashboardClient 
          initialPendingUsers={pendingUsers}
          initialPendingApps={pendingApps}
          initialTodayApps={todayApps}
          initialSkills={skills}
          initialUsageLogs={usageLogs}
        />
      </div>
    </main>
  );
}
