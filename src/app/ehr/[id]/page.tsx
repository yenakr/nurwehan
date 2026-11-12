import { getCurrentUser } from '@/lib/auth';
import { getCase } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import EhrEditor from './EhrEditor';
import { emptyChart, type ChartData } from '../types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR 연습' };

export default async function EhrCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/ehr/${id}`);
  const row = await getCase(user.id, id);
  if (!row) notFound();
  const data = { ...emptyChart(), ...((row.data as Partial<ChartData>) || {}) } as ChartData;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        <EhrEditor id={row.id} initialTitle={row.title} subject={row.subject} initial={data} />
      </div>
    </main>
  );
}
