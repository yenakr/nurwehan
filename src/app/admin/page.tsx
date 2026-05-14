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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    allUsers,
    allParticipants,
    skills,
    pendingApps
  ] = await Promise.all([
    // 1. All users for student management
    prisma.user.findMany({
      include: {
        restrictions: {
          where: { endDate: { gte: new Date() } }
        },
        warnings: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    // 2. Today's participants for attendance management
    prisma.applicationParticipant.findMany({
      where: {
        application: {
          slot: {
            date: {
              gte: today,
              lt: tomorrow
            }
          }
        }
      },
      include: {
        application: {
          include: {
            representativeUser: true,
            slot: true,
            skills: { include: { skill: true } },
            usageLogs: true
          }
        }
      }
    }),
    // 3. Skills and supplies
    prisma.skill.findMany({
      include: { supplies: true },
      orderBy: { name: 'asc' }
    }),
    // 4. Pending applications for quick check
    prisma.application.findMany({
      where: { status: 'PENDING' },
      include: {
        representativeUser: true,
        slot: true,
        skills: { include: { skill: true } },
        participants: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
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
            {user.name} 관리자님, 오늘 하루도 수고 많으십니다.
          </p>
        </div>

        <AdminDashboardClient 
          initialUsers={allUsers as any}
          initialParticipants={allParticipants as any}
          initialSkills={skills}
          initialPendingApps={pendingApps as any}
          selectedDate={today.toISOString().split('T')[0]}
        />
      </div>
    </main>
  );
}
