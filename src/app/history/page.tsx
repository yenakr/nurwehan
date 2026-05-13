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
            내 신청 내역
          </h1>
          <p style={{ color: 'var(--sub-text)', marginTop: '8px' }}>
            신청한 OPEN LAB 내역을 확인하고 관리할 수 있습니다.
          </p>
        </div>

        <HistoryClient 
          initialApplications={applications} 
          currentUser={session.user} 
        />
      </div>
    </main>
  );
}
