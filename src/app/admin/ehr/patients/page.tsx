import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { listCases } from '@/lib/ehr';
import { listClasses, listVirtuals } from '@/lib/ehr-class';
import { SAMPLES } from '@/app/ehr/samples';
import PatientsClient, { type VRow } from './PatientsClient';

export const dynamic = 'force-dynamic';

export default async function EhrPatientsPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr/patients');
  const [vs, classes, mine] = await Promise.all([listVirtuals(), listClasses(), listCases(user.id)]);
  const rows: VRow[] = vs.map(v => {
    const i = ((v.data as { info?: Record<string, string> })?.info) || {};
    return { id: v.id, classId: v.classId, published: v.published, ptNo: i.ptNo || '', name: i.name || '', ageSex: i.ageSex || '', dept: i.dept || '', ward: i.ward || '', bed: i.bed || '', dx: i.dx || '', cc: i.cc || '', doctor: i.doctor || '', allergy: i.allergy || '' };
  });
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 16 }}>
          <Link href="/admin/ehr" style={{ color: 'inherit' }}>← EHR</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>가상환자 관리</h1>
        </div>
        <PatientsClient
          rows={rows}
          classes={classes.map(c => ({ id: c.id, label: `${c.year}-${c.term} ${c.subject} ${c.grade}-${c.section}` }))}
          samples={SAMPLES.map(s => ({ key: s.key, label: s.title }))}
          mine={mine.map(c => ({ id: c.id, label: `${c.name || c.title}${c.dx ? ` · ${c.dx}` : ''}` }))}
        />
      </div>
    </main>
  );
}
