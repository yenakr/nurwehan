import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ApplyForm from './ApplyForm';

export const dynamic = 'force-dynamic';

export default async function OpenLabApplyPage() {
  const session = await getSession();
  let user = null;
  
  if (session?.user) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user) {
      // Authorization Checks
      if (user.approvalStatus === 'SUSPENDED') {
        return (
          <main style={{ backgroundColor: 'var(--muted-background)', minHeight: 'calc(100vh - 64px)', padding: '60px 20px' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#B91C1C', marginBottom: '16px', fontSize: '1.25rem' }}>접근 제한</h2>
                <p style={{ lineHeight: '1.6' }}>이용이 제한된 계정입니다.</p>
                <Link href="/" className="btn-primary" style={{ marginTop: '24px' }}>홈으로 이동</Link>
              </div>
            </div>
          </main>
        );
      }
    }
  }

  const userData = user ? {
    id: user.id,
    name: user.name,
    studentId: user.studentId,
    phone: user.phone || '',
    grade: user.grade || 1,
    role: user.role
  } : null;

  return (
    <main style={{ backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', marginBottom: '32px' }}>
            OPEN LAB 사용 신청 {!userData && <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--sub-text)', marginLeft: '8px' }}>(비회원 신청)</span>}
          </h1>
          <ApplyForm user={userData} />
        </div>
      </div>
    </main>
  );
}
