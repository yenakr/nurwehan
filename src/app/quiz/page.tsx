import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import QuizClient from './QuizClient';
import GateForm from './GateForm';
import { gateEnabled, guestAllowed } from '@/lib/quiz-gate';
import { hiddenSubjectsFor, getSubjectLevels } from '@/lib/access';
import { isSuperAdmin } from '@/lib/auth-core';

export const dynamic = 'force-dynamic';

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const user = await getCurrentUser();

  const guest = !user && (await guestAllowed());

  if (!user && !guest && gateEnabled()) {
    return (
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
        <div className="container">
          <GateForm />
        </div>
      </main>
    );
  }

  const hidden = await hiddenSubjectsFor(user);
  const subjectLevels = user && isSuperAdmin(user.role) ? await getSubjectLevels() : {};

  // 로그인도 코드 통과도 아닌 경우 데이터를 내려보내지 않는다
  const terms = !user && !guest ? [] : await prisma.nursingTerm.findMany({
    where: hidden.length > 0 ? { subject: { notIn: hidden } } : undefined,
    // 입력한 순서(createdAt)를 우선한다. 같은 시각에 한꺼번에 들어간 기존 데이터는 예전처럼 퀴즈·용어순.
    orderBy: [{ subject: 'asc' }, { createdAt: 'asc' }, { category: 'asc' }, { term: 'asc' }],
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container">
        <QuizClient initialTerms={terms} user={user} initialSubject={subject} subjectLevels={subjectLevels} superAdmin={!!user && isSuperAdmin(user.role)} guest={guest} />
      </div>
    </main>
  );
}
