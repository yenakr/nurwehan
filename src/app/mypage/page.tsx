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

          {/* Status Overview Section */}
          <section className="card" style={{ border: isRestricted ? '2px solid #ef4444' : '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '20px' }}>계정 상태 및 제한 내역</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>신청 가능 여부</span>
                <p style={{ fontSize: '1.125rem', fontWeight: '800', marginTop: '4px', color: isRestricted ? '#ef4444' : '#10b981' }}>
                  {isRestricted ? '신청 제한' : '신청 가능'}
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>정리불량 누적 횟수</span>
                <p style={{ fontSize: '1.125rem', fontWeight: '800', marginTop: '4px', color: warningCount >= 3 ? '#ef4444' : '#1e293b' }}>
                  {warningCount}회 {warningCount >= 3 && <span style={{ fontSize: '0.75rem' }}>(영구 제한)</span>}
                </p>
              </div>
            </div>

            {isRestricted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#ef4444' }}>⚠️ 현재 다음 사유로 인해 신청이 제한되고 있습니다:</p>
                {activeRestrictions.map(r => (
                  <div key={r.id} style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
                    <p style={{ fontWeight: '700', marginBottom: '4px', fontSize: '0.9375rem' }}>{r.reason}</p>
                    <p style={{ fontSize: '0.8125rem', color: '#b91c1c' }}>
                      기간: {new Date(r.startDate).toLocaleDateString('ko-KR')} ~ {r.endDate && new Date(r.endDate).getFullYear() < 9000 ? new Date(r.endDate).toLocaleDateString('ko-KR') : '영구'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {!isRestricted && warningCount > 0 && warningCount < 3 && (
              <p style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: '500' }}>
                알림: 정리불량이 {warningCount}회 기록되었습니다. 3회 누적 시 OPEN LAB 신청이 영구적으로 제한됩니다.
              </p>
            )}

            {!isRestricted && warningCount === 0 && (
              <p style={{ color: 'var(--sub-text)', fontSize: '0.875rem' }}>현재 적용된 신청 제한 내역이 없습니다.</p>
            )}
          </section>

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
