import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ApplicationListClient from './ApplicationListClient';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      representativeUser: true,
      slot: true,
      skills: { include: { skill: true } }
    }
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0 40px' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 14px' }}>신청서 내역</h1>
        <ApplicationListClient initialApplications={applications as any} />
      </div>
    </main>
  );
}
