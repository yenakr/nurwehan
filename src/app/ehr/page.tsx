import { getCurrentUser } from '@/lib/auth';
import { listCases } from '@/lib/ehr';
import { redirect } from 'next/navigation';
import EhrHome from './EhrHome';
import { aiConfigured } from '@/lib/ai';
import { hasChecklistAccess } from '@/lib/checklist-access';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR 연습' };

export default async function EhrPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr');
  const cases = await listCases(user.id);
  const ai = aiConfigured() && (await hasChecklistAccess(user));
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <EhrHome ai={ai} initialView={view} cases={cases.map(c => ({ id: c.id, ward: c.ward, bed: c.bed, sampleKey: c.sampleKey, ptNo: c.ptNo, name: c.name, ageSex: c.ageSex, dx: c.dx, doctor: c.doctor, admit: c.admit, dept: c.dept, visitTime: c.visitTime, vstatus: c.vstatus, ktas: c.ktas, zone: c.zone, cc: c.cc, discharged: c.discharged, submitted: c.submitted, reviewed: c.reviewed }))} />
      </div>
    </main>
  );
}
