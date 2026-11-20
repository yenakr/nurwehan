import { getCurrentUser } from '@/lib/auth';
import { listCases } from '@/lib/ehr';
import { listVirtuals, studentVirtuals } from '@/lib/ehr-class';
import { isAdminRole } from '@/lib/auth-core';
import type { Sample } from './types';
import { notFound, redirect } from 'next/navigation';
import EhrHome from './EhrHome';
import { aiConfigured } from '@/lib/ai';
import { hasEhrAccess, EHR_CASE_LIMIT } from '@/lib/ehr-access';
import { aiQuotaLeft } from '@/lib/practicum-ai';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR' };

export default async function EhrPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr');
  if (!(await hasEhrAccess(user))) notFound();
  const cases = await listCases(user.id);
  const extra: Sample[] = (isAdminRole(user.role) ? (await listVirtuals()).filter(v => v.published) : await studentVirtuals(user.id)).map(v => {
    const d = v.data as Sample['data'];
    const key = `v:${v.id}`;
    return { key, subject: d.info?.ward || '', title: `${d.info?.name || '가상환자'} · ${d.info?.dx || ''}`, data: { ...d, info: { ...d.info, sampleKey: key } } };
  });
  const ai = aiConfigured();
  const aiLeft = ai ? await aiQuotaLeft(user.id, '#ehrgen', EHR_CASE_LIMIT) : 0;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <EhrHome extra={extra} ai={ai} aiLeft={aiLeft} initialView={view} cases={cases.map(c => ({ id: c.id, ward: c.ward, bed: c.bed, sampleKey: c.sampleKey, ptNo: c.ptNo, name: c.name, ageSex: c.ageSex, dx: c.dx, doctor: c.doctor, admit: c.admit, dept: c.dept, visitTime: c.visitTime, vstatus: c.vstatus, ktas: c.ktas, zone: c.zone, cc: c.cc, discharged: c.discharged, submitted: c.submitted, reviewed: c.reviewed }))} />
      </div>
    </main>
  );
}
