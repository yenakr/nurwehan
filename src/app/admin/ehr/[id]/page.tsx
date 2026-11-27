import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { getCaseAny } from '@/lib/ehr';
import { migrate } from '@/app/ehr/types';
import ReviewClient from './ReviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminEhrDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr');
  const { id } = await params;
  const c = await getCaseAny(id);
  if (!c) notFound();
  const data = migrate(c.data);
  if (!data.info.submitted) notFound();
  const stu = await prisma.user.findUnique({ where: { id: c.userId }, select: { name: true, studentId: true } }).catch(() => null);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: 960 }}>
        <Link href="/admin/ehr" style={{ fontSize: '0.875rem', color: 'var(--sub-text)', fontWeight: 600 }}>&lsaquo; 목록</Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '8px 0 4px' }}>{c.title}</h1>
        <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>{data.info.examNo ? `${data.info.examName || ''} (${data.info.examNo})` : stu ? `${stu.name} (${stu.studentId})` : ''}</p>
        <ReviewClient id={c.id} data={data} />
      </div>
    </main>
  );
}
