import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';
import PasswordForm from './PasswordForm';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/mypage');
  }

  // Fetch full user data including restrictions and warnings
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
    }
  });

  if (!fullUser) redirect('/login');

  const activeRestrictions = fullUser.restrictions;
  const isRestricted = activeRestrictions.length > 0;
  const warningCount = fullUser.warnings.length;

  const until = isRestricted
    ? activeRestrictions.reduce((m, r) => (r.endDate > m ? r.endDate : m), activeRestrictions[0].endDate)
    : null;
  const notice = [
    until ? `이용 제한 ${until.getMonth() + 1}/${until.getDate()}까지` : '',
    warningCount > 0 ? `경고 ${warningCount}회` : '',
  ].filter(Boolean).join(' · ') || null;

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0 calc(40px + var(--bnav-h, 0px))' }}>
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
        }} notice={notice} />

        <PasswordForm />
      </div>
    </main>
  );
}
