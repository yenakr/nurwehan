import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import HistoryClient from './HistoryClient';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }

  const applications = await prisma.application.findMany({
    where: {
      OR: [
        { representativeUserId: session.user.id },
        { guestStudentId: session.user.studentId },
        { participants: { some: { studentId: session.user.studentId } } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      slot: true,
      skills: { include: { skill: true } },
      participants: true,
      usageLogs: {
        where: { submittedBy: session.user.studentId }
      }
    }
  });

  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0', flex: 1 }}>
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)' }}>
            신청서 작성 내역
          </h1>
        </div>

        <HistoryClient 
          initialApplications={applications} 
          currentUser={session.user} 
        />
      </div>
    </main>
  );
}
