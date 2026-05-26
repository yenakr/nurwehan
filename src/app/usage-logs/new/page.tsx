import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import UsageLogForm from './UsageLogForm';

export default async function NewUsageLogPage({ searchParams }: { searchParams: Promise<{ applicationId: string }> }) {
  const user = await getCurrentUser();
  const { applicationId } = await searchParams;

  if (!user) {
    redirect(`/login?redirect=/usage-logs/new?applicationId=${applicationId}`);
  }

  if (!applicationId) {
    return (
      <main className="container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444' }}>잘못된 접근</h1>
          <p>신청 내역 ID가 없습니다.</p>
        </div>
      </main>
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      representativeUser: true,
      slot: true,
      skills: { include: { skill: true } },
      participants: true,
      usageLogs: {
        where: { submittedBy: user.studentId }
      }
    }
  });

  if (!application) notFound();

  // Condition Check
  const isParticipant = application.participants.some(p => p.studentId === user.studentId);
  const isRep = application.representativeUser?.studentId === user.studentId || application.guestStudentId === user.studentId;
  
  if (!isParticipant && !isRep) {
    return (
      <main className="container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444' }}>접근 권한 없음</h1>
          <p>해당 OPEN LAB 신청의 참여자만 실습 소감을 작성할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  if (application.status !== 'APPROVED' && application.status !== 'COMPLETED') {
    return (
      <main className="container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444' }}>작성 불가</h1>
          <p>승인된 OPEN LAB에 대해서만 실습 소감을 작성할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  if (application.usageLogs.length > 0) {
    return (
      <main className="container" style={{ padding: '40px 0' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--primary)' }}>제출 완료</h1>
          <p>이미 실습 소감을 제출하셨습니다.</p>
          <Link href="/history" className="btn-outline" style={{ marginTop: '20px', display: 'inline-block' }}>내 신청 내역으로</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>
          OPEN LAB 실습 소감 작성
        </h1>
        
        <UsageLogForm application={application} user={user} />
      </div>
    </main>
  );
}

import Link from 'next/link';
