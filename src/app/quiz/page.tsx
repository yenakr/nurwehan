import { prisma } from '@/lib/prisma';
import QuizClient from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  const terms = await prisma.nursingTerm.findMany({
    orderBy: [{ subject: 'asc' }, { category: 'asc' }, { term: 'asc' }],
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container">
        <QuizClient initialTerms={terms} />
      </div>
    </main>
  );
}
