import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { redirect } from 'next/navigation';
import QuizStatsClient from './QuizStatsClient';

export const dynamic = 'force-dynamic';

export default async function AdminQuizStatsPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        <QuizStatsClient />
      </div>
    </main>
  );
}
