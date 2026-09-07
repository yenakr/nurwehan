import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  // Fetch full user data including restrictions, warnings, and applications
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      restrictions: {
        where: { 
          isActive: true, 
          endDate: { gte: new Date() }
        }
      },
      warnings: true,
      applications: {
        orderBy: { createdAt: 'desc' },
        include: { 
          slot: true,
          skills: { include: { skill: true } }
        }
      }
    }
  });

  if (!fullUser) redirect('/login');

  const activeRestrictions = fullUser.restrictions;
  const isRestricted = activeRestrictions.length > 0;
  const warningCount = fullUser.warnings.length;

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
          마이페이지
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Section */}
          <ProfileForm user={{
            id: fullUser.id,
            name: fullUser.name,
            studentId: fullUser.studentId,
            grade: fullUser.grade,
            email: fullUser.email,
            phone: fullUser.phone,
            approvalStatus: fullUser.approvalStatus,
            rejectedReason: fullUser.rejectedReason
          }} />

          {/* Recent Applications Section */}
          <section className="card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '16px' }}>최근 신청 내역</h2>
            
            {/* Desktop View */}
            <div className="table-container hide-mobile">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>날짜</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>시간</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>장소</th>
                    <th style={{ padding: '12px', fontSize: '0.8125rem' }}>술기</th>
                  </tr>
                </thead>
                <tbody>
                  {fullUser.applications.length > 0 ? fullUser.applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{new Date(app.slot.date).toLocaleDateString('ko-KR')}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{app.slot.startTime} ~ {app.slot.endTime}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>{app.slot.room}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                        <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.skills.map(s => s.skill.name).join(', ')}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--sub-text)', fontSize: '0.875rem' }}>작성 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="show-mobile" style={{ display: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fullUser.applications.length > 0 ? fullUser.applications.map(app => (
                  <div key={app.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9375rem' }}>{new Date(app.slot.date).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '4px' }}>시간: {app.slot.startTime} ~ {app.slot.endTime}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '4px' }}>장소: {app.slot.room}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>술기: {app.skills.map(s => s.skill.name).join(', ')}</div>
                  </div>
                )) : (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--sub-text)' }}>작성 내역이 없습니다.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
