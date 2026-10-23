import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import QuizClient from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const user = await getCurrentUser();

  const terms = await prisma.nursingTerm.findMany({
    // 입력한 순서(createdAt)를 우선한다. 같은 시각에 한꺼번에 들어간 기존 데이터는 예전처럼 퀴즈·용어순.
    orderBy: [{ subject: 'asc' }, { createdAt: 'asc' }, { category: 'asc' }, { term: 'asc' }],
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container">
        <QuizClient initialTerms={terms} user={user} initialSubject={subject} />
      </div>
    </main>
  );
}
