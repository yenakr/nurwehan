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

  const [
    skills,
    allApplications
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
    })
  ]);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)' }}>
            관리자 대시보드
          </h1>
        </div>

        <AdminDashboardClient 
          initialUsers={[]}
          initialParticipants={[]}
          initialSkills={skills}
          initialApplications={allApplications as any}
          selectedDate={new Date().toISOString().split('T')[0]}
        />
      </div>
    </main>
  );
}
