import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  // Fetch full user data including restrictions and applications
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      restrictions: {
        where: { isActive: true, endDate: { gte: new Date() } }
      },
      applications: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { slot: true }
      },
      participations: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { application: { include: { slot: true } } }
      }
    }
  });

  if (!fullUser) redirect('/login');

  const isRestricted = fullUser.restrictions.length > 0;

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
          마이페이지
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Section */}
          <section className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              기본 정보
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>이름</label>
                <div style={{ fontWeight: '600' }}>{fullUser.name}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>학번</label>
                <div style={{ fontWeight: '600' }}>{fullUser.studentId}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>학년</label>
                <div style={{ fontWeight: '600' }}>{fullUser.grade || '-'}학년</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>계정 상태</label>
                <div style={{ fontWeight: '600', color: fullUser.approvalStatus === 'APPROVED' ? 'var(--primary)' : '#f59e0b' }}>
                  {fullUser.approvalStatus === 'APPROVED' ? '승인완료' : 
                   fullUser.approvalStatus === 'PENDING' ? '승인대기' : 
                   fullUser.approvalStatus === 'REJECTED' ? '반려' : fullUser.approvalStatus}
                </div>
              </div>
            </div>
          </section>

          {/* Restriction Section */}
          <section className="card" style={{ border: isRestricted ? '2px solid #ef4444' : '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '16px', color: isRestricted ? '#ef4444' : 'inherit' }}>
              신청 제한 내역
            </h2>
            {isRestricted ? (
              <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>사유: {fullUser.restrictions[0].reason}</p>
                <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>
                  제한 종료일: {new Date(fullUser.restrictions[0].endDate).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--sub-text)', fontSize: '0.875rem' }}>현재 적용된 신청 제한 내역이 없습니다.</p>
            )}
          </section>

          {/* Recent Applications Section */}
          <section className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '16px' }}>최근 신청 내역</h2>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>날짜</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>장소</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {fullUser.applications.length > 0 ? fullUser.applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{new Date(app.slot.date).toLocaleDateString('ko-KR')} {app.slot.startTime}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{app.slot.room}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                        <span className={`badge badge-${app.status.toLowerCase()}`}>
                          {app.status === 'PENDING' ? '대기' : app.status === 'APPROVED' ? '승인' : '반려'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--sub-text)', fontSize: '0.875rem' }}>신청 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
