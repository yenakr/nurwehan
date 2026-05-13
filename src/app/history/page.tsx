import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function HistoryPage() {
  const session = await getSession();
  
  if (!session?.user) {
    return null; // Should be handled by middleware, but safety first
  }

  const applications = await prisma.application.findMany({
    where: { representativeUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      slot: true,
      skills: { include: { skill: true } }
    }
  });

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
                      <td>{app.skills.map(s => s.skill.name).join(', ')}</td>
                      <td>
                        <span className={`badge badge-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.status === 'APPROVED' ? (
                          <Link href={`/usage-log/${app.id}`} className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            제출하기
                          </Link>
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
