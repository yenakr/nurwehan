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

  const fmtDate = (d: Date | string) => {
    const x = new Date(d);
    const w = ['일', '월', '화', '수', '목', '금', '토'][x.getDay()];
    return `${x.getMonth() + 1}/${x.getDate()} (${w})`;
  };

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0 40px' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 14px' }}>마이페이지</h1>

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

        <section className="mp-card" style={{ marginTop: 12 }}>
          <div className="mp-head"><h2>최근 신청서</h2></div>
          {fullUser.applications.length > 0 ? (
            <ul className="mp-list">
              {fullUser.applications.map(app => (
                <li key={app.id}>
                  <div className="mp-row1">
                    <b>{fmtDate(app.slot.date)}</b>
                    <span>{app.slot.startTime}~{app.slot.endTime}</span>
                    <span className="mp-room">{app.slot.room}</span>
                  </div>
                  <div className="mp-skills">{app.skills.map(s => s.skill.name).join(', ')}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mp-empty">아직 없어요</p>
          )}
        </section>
      </div>
      <style>{`
        .mp-list{list-style:none;margin:0;padding:0}
        .mp-list li{padding:10px 0;border-top:1px solid var(--border)}
        .mp-list li:first-child{border-top:0}
        .mp-row1{display:flex;gap:8px;align-items:baseline;font-size:.875rem}
        .mp-row1 span{color:var(--sub-text)}
        .mp-row1 .mp-room{margin-left:auto;font-size:.8125rem}
        .mp-skills{font-size:.8125rem;color:var(--primary);margin-top:3px;line-height:1.4}
        .mp-empty{text-align:center;color:var(--sub-text);font-size:.875rem;padding:16px 0 4px;margin:0}
      `}</style>
    </main>
  );
}
