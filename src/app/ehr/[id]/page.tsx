import { getCurrentUser } from '@/lib/auth';
import { getCase, listCases, ordersByCase } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import EhrEditor from './EhrEditor';
import { migrate } from '../types';
import { hasEhrAccess, EHR_FEEDBACK_LIMIT } from '@/lib/ehr-access';
import { aiQuotaLeft } from '@/lib/practicum-ai';
import { aiConfigured } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR' };

export default async function EhrCasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params;
  const { print } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/ehr/${id}`);
  if (!(await hasEhrAccess(user))) notFound();
  const row = await getCase(user.id, id);
  if (!row) notFound();
  const data = migrate(row.data);
  const mode = data.info.mode === 'skill' ? 'skill' : 'free';
  const ordMap = await ordersByCase(user.id, mode);
  const roster = (await listCases(user.id, mode)).filter(c => !c.discharged).map(c => ({ id: c.id, ward: c.ward, bed: c.bed, name: c.name, ageSex: c.ageSex, ptNo: c.ptNo, doctor: c.doctor, admit: c.admit, disDate: c.disDate, orders: (ordMap[c.id] || []) as Record<string, string>[] }));
  const ai = aiConfigured();
  const aiLeft = ai ? await aiQuotaLeft(user.id, '#ehrfb', EHR_FEEDBACK_LIMIT) : 0;
  const skillLeft = ai && mode === 'skill' ? await aiQuotaLeft(user.id, '#ehrskill', EHR_FEEDBACK_LIMIT) : 0;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <EhrEditor id={row.id} initialTitle={row.title} subject={row.subject} initial={data} ai={ai} aiLeft={aiLeft} skillLeft={skillLeft} userName={user.name} printKind={print} roster={roster} />
      </div>
    </main>
  );
}
