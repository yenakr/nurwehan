import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { purgeExpiredAssignments } from '@/lib/clinical';
import AssignmentImportClient from './AssignmentImportClient';

export const dynamic = 'force-dynamic';

export default async function ClinicalAssignmentsPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/clinical-assignments');

  await purgeExpiredAssignments();

  const terms = await prisma.clinicalAssignment
    .groupBy({
      by: ['term'],
      _count: { _all: true },
      _min: { startDate: true },
      _max: { endDate: true },
    })
    .catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <AssignmentImportClient
          terms={terms.map(t => ({
            term: t.term,
            rows: t._count._all,
            start: t._min.startDate,
            end: t._max.endDate,
          }))}
        />
      </div>
    </main>
  );
}
