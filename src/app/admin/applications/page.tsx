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
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
          신청 현황 관리
        </h1>
        
        <ApplicationListClient initialApplications={applications as any} />
      </div>
    </main>
  );
}
