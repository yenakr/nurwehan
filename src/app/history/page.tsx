import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return null; // Should be handled by middleware, but safety first
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
      usageLogs: {
        where: { submittedBy: session.user.studentId }
      }
    }
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '승인 대기';
      case 'APPROVED': return '승인 완료';
      case 'REJECTED': return '반려됨';
      case 'COMPLETED': return '이용 완료';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0', flex: 1 }}>
        <div className="container">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', marginBottom: '32px' }}>
            내 신청 내역
          </h1>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>사용 일자</th>
                    <th>시간</th>
                    <th>장소</th>
                    <th>선택 술기</th>
                    <th>상태</th>
                    <th>사용일지</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length > 0 ? applications.map(app => (
                    <tr key={app.id}>
                      <td>{new Date(app.slot.date).toLocaleDateString('ko-KR')}</td>
                      <td>{app.slot.startTime} - {app.slot.endTime}</td>
                      <td>{app.slot.room}</td>
                      <td>{app.skills.map(as => as.skill.name).join(', ')}</td>
                      <td>
                        <span className={`badge badge-${app.status.toLowerCase()}`}>
                          {getStatusText(app.status)}
                        </span>
                      </td>
                      <td>
                        {app.usageLogs.length > 0 ? (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '700' }}>제출완료</span>
                        ) : (app.status === 'APPROVED' || app.status === 'COMPLETED') ? (
                          <Link href={`/usage-logs/new?applicationId=${app.id}`} className="btn-small btn-primary" style={{ fontSize: '0.75rem', padding: '4px 8px', textDecoration: 'none' }}>
                            작성하기
                          </Link>
                        ) : app.status === 'PENDING' ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>승인 후 작성</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--sub-text)' }}>
                        신청 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
  );
}
