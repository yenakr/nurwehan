import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import ApplyForm from './ApplyForm';

export default async function OpenLabApplyPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login?redirect=/open-lab');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      restrictions: { 
        where: { 
          isActive: true, 
          endDate: { gte: new Date() } 
        } 
      } 
    }
  });

  if (!user) redirect('/login');

  // Authorization Checks
  if (user.approvalStatus !== 'APPROVED') {
    let message = '관리자 승인 대기 중입니다.';
    if (user.approvalStatus === 'REJECTED') message = '회원 승인이 반려되어 신청할 수 없습니다. 사유: ' + (user.rejectedReason || '없음');
    if (user.approvalStatus === 'SUSPENDED') message = '이용이 제한된 계정입니다.';
    
    return (
      <>
        {/* @ts-expect-error Async Server Component */}
        <Header />
        <main style={{ backgroundColor: 'var(--muted-background)', minHeight: 'calc(100vh - 64px)', padding: '60px 20px' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#B91C1C', marginBottom: '16px', fontSize: '1.25rem' }}>접근 제한</h2>
              <p style={{ lineHeight: '1.6' }}>{message}</p>
              <Link href="/" className="btn-primary" style={{ marginTop: '24px' }}>홈으로 이동</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (user.restrictions.length > 0) {
    const restriction = user.restrictions[0];
    return (
      <>
        {/* @ts-expect-error Async Server Component */}
        <Header />
        <main style={{ backgroundColor: 'var(--muted-background)', minHeight: 'calc(100vh - 64px)', padding: '60px 20px' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#B91C1C', marginBottom: '16px', fontSize: '1.25rem' }}>OPEN LAB 신청 제한</h2>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontWeight: '700', marginBottom: '8px', fontSize: '1.125rem' }}>사유: {restriction.reason}</p>
                <p style={{ color: 'var(--sub-text)' }}>제한 종료일: {new Date(restriction.endDate).toLocaleDateString('ko-KR')}</p>
              </div>
              <Link href="/" className="btn-primary">홈으로 이동</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const userData = {
    name: user.name,
    studentId: user.studentId,
    phone: user.phone || '',
    grade: user.grade || 1,
  };

  return (
    <>
      {/* @ts-expect-error Async Server Component */}
      <Header />
      <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', marginBottom: '32px' }}>
              OPEN LAB 사용 신청
            </h1>
            <ApplyForm user={userData} />
          </div>
        </div>
      </main>
    </>
  );
}
