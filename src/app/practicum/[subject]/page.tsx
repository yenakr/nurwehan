import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProgress } from '@/lib/practicum';
import { SUBJECTS } from '../data';
import ChecklistClient from './ChecklistClient';

export const dynamic = 'force-dynamic';

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const sub = SUBJECTS.find(s => s.key === subject);
  if (!sub) return notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/practicum/${subject}`);
  const initial = await getProgress(user.id, subject);
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0 60px' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <ChecklistClient subject={sub} initial={initial as never} />
      </div>
    </main>
  );
}
