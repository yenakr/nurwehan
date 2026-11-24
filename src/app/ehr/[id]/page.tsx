import { getCurrentUser } from '@/lib/auth';
import { getCase } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import EhrEditor from './EhrEditor';
import EhrView from './EhrView';
import { migrate } from '../types';
import { hasEhrAccess, EHR_FEEDBACK_LIMIT } from '@/lib/ehr-access';
import { aiQuotaLeft } from '@/lib/practicum-ai';
import { aiConfigured } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR' };

export default async function EhrCasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/ehr/${id}`);
  if (!(await hasEhrAccess(user))) notFound();
  const row = await getCase(user.id, id);
  if (!row) notFound();
  const data = migrate(row.data);
  if (!edit) {
    return (
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 12px' }}>
        <EhrView id={row.id} title={row.title} data={data} />
      </main>
    );
  }
  const ai = aiConfigured();
  const aiLeft = ai ? await aiQuotaLeft(user.id, '#ehrfb', EHR_FEEDBACK_LIMIT) : 0;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <EhrEditor id={row.id} initialTitle={row.title} subject={row.subject} initial={data} ai={ai} aiLeft={aiLeft} userName={user.name} />
      </div>
    </main>
  );
}
