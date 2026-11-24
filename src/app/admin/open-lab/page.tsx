import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { OpenLabSettings } from '../AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminOpenLabPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    redirect('/login?redirect=/admin/open-lab');
  }

  const skills = await prisma.skill.findMany({
    include: { supplies: true },
    orderBy: { name: 'asc' },
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '24px 0 40px' }}>
      <div className="container">
        <Link href="/admin" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--sub-text)' }}>← 관리자</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 16px' }}>OPEN LAB 운영 설정</h1>
        <OpenLabSettings initialSkills={skills} />
      </div>
    </main>
  );
}
