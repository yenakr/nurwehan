import { getCurrentUser } from '@/lib/auth';
import { listCases } from '@/lib/ehr';
import { redirect } from 'next/navigation';
import EhrHome from './EhrHome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EHR 연습' };

export default async function EhrPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr');
  const cases = await listCases(user.id);
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <EhrHome cases={cases.map(c => ({ id: c.id, title: c.title, subject: c.subject, updatedAt: new Date(c.updatedAt).toISOString() }))} />
      </div>
    </main>
  );
}
