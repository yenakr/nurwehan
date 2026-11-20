import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { classMembers, listClasses } from '@/lib/ehr-class';
import ClassesClient from './ClassesClient';

export const dynamic = 'force-dynamic';

export default async function EhrClassesPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr/classes');
  const [classes, members, students] = await Promise.all([
    listClasses(),
    classMembers(),
    prisma.user.findMany({ where: { approvalStatus: 'APPROVED', role: 'STUDENT' }, select: { id: true, name: true, studentId: true, grade: true }, orderBy: { studentId: 'asc' } }).catch(() => []),
  ]);
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 16 }}>
          <Link href="/admin/ehr" style={{ color: 'inherit' }}>← EHR</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>분반 관리</h1>
        </div>
        <ClassesClient classes={classes} members={members} students={students.map(s => ({ id: s.id, name: s.name, studentId: s.studentId, grade: s.grade ?? 0 }))} />
      </div>
    </main>
  );
}
