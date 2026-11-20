import { getCurrentUser } from '@/lib/auth';
import { getCase } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import EhrEditor from './EhrEditor';
import { migrate } from '../types';
import { hasChecklistAccess } from '@/lib/checklist-access';
import { aiConfigured } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR 연습' };

export default async function EhrCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/ehr/${id}`);
  const row = await getCase(user.id, id);
  if (!row) notFound();
  const data = migrate(row.data);
  const ai = aiConfigured() && (await hasChecklistAccess(user));
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: 'none' }}>
        <EhrEditor id={row.id} initialTitle={row.title} subject={row.subject} initial={data} ai={ai} userName={user.name} />
      </div>
    </main>
  );
}
