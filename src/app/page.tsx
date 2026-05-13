import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;
  
  // Fetch official notice
  const notice = await prisma.notice.findUnique({
    where: { id: 'official-guide' }
  });

  // Fetch recent applications if logged in
  const recentApplications = (isLoggedIn && session?.user)
    ? await prisma.application.findMany({
        where: { representativeUserId: session.user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { slot: true }
      })
    : [];

  return (
    <>
      <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '40px 0' }}>
        <div className="container">
          
          {/* Hero / Application Section */}
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: 'var(--muted-background)',
            borderRadius: '8px',
            marginBottom: '48px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>
              한양대학교 간호대학 OPEN LAB 신청
            </h2>
            <p style={{ color: 'var(--sub-text)', marginBottom: '40px', fontSize: '1.125rem' }}>
              안전하고 효율적인 실습실 사용을 위해 신청 수칙을 반드시 준수해 주시기 바랍니다.
            </p>
            
            <Link href="/open-lab" className="btn-accent">
              OPEN LAB 신청하기
            </Link>
            
            {!isLoggedIn && (
              <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>
                * 로그인이 필요한 서비스입니다.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            
            {/* Notice Section */}
            <section>
              <h3 className="section-title">
                <span>OPEN LAB 이용 안내</span>
              </h3>
              <div className="card" style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text)' }}>
                {notice ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {notice.content}
                  </div>
                ) : (
                  <p>공지사항을 불러오는 중입니다...</p>
                )}
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <Link href="/notices" style={{ color: 'var(--primary)', fontWeight: '600' }}>전체 공지 보기 →</Link>
                </div>
              </div>
            </section>

            {/* My Recent History (Visible only when logged in) */}
            <section>
              <h3 className="section-title">
                <span>최근 내 신청 내역</span>
              </h3>
              <div className="card">
                {isLoggedIn ? (
                  recentApplications.length > 0 ? (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>날짜</th>
                            <th>시간</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentApplications.map(app => (
                            <tr key={app.id}>
                              <td>{new Date(app.slot.date).toLocaleDateString('ko-KR')}</td>
                              <td>{app.slot.startTime}</td>
                              <td>
                                <span className={`badge badge-${app.status.toLowerCase()}`}>
                                  {app.status === 'PENDING' ? '승인대기' : 
                                   app.status === 'APPROVED' ? '승인완료' : 
                                   app.status === 'REJECTED' ? '반려' : app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>
                      <p>최근 신청 내역이 없습니다.</p>
                    </div>
                  )
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>
                    <p style={{ fontSize: '0.875rem' }}>로그인 후 내 신청 내역을 확인할 수 있습니다.</p>
                    <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '12px', display: 'inline-block' }}>로그인하기</Link>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
      
      <footer style={{ 
        backgroundColor: 'var(--muted-background)', 
        borderTop: '1px solid var(--border)', 
        padding: '40px 0',
        color: 'var(--sub-text)',
        fontSize: '0.8125rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px' }}>
            <div>
              <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '8px', fontSize: '0.9375rem' }}>한양대학교 간호대학</p>
              <p>서울특별시 성동구 왕십리로 222 한양대학교 간호대학 행정팀</p>
              <p>© 2026 Hanyang University College of Nursing. All Rights Reserved.</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontWeight: '500' }}>
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
