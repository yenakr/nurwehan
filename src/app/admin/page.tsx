import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  if (!isAdminRole(user.role)) {
    return (
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container">
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', color: '#ef4444' }}>
              접근 권한 없음
            </h1>
            <p style={{ color: 'var(--sub-text)' }}>관리자 전용 페이지입니다. 접근 권한이 필요합니다.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <div className="card">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
            관리자 대시보드
          </h1>
          <p style={{ color: 'var(--text)', marginBottom: '20px' }}>
            {user.name}님, 환영합니다.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '32px' }}>
            <div className="card" style={{ border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: '700' }}>학생 승인 관리</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '24px', flex: 1 }}>가입 대기 중인 학생들을 승인합니다.</p>
              <Link href="/admin/users" className="btn-outline" style={{ width: '100%', textAlign: 'center' }}>관리하기</Link>
            </div>
            <div className="card" style={{ border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: '700' }}>신청 현황 관리</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '24px', flex: 1 }}>OPEN LAB 신청 내역을 관리합니다.</p>
              <Link href="/admin/applications" className="btn-outline" style={{ width: '100%', textAlign: 'center' }}>관리하기</Link>
            </div>
            <div className="card" style={{ border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: '700' }}>공지사항 관리</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '24px', flex: 1 }}>학부 공지사항을 등록/수정합니다.</p>
              <Link href="/admin/notices" className="btn-outline" style={{ width: '100%', textAlign: 'center' }}>관리하기</Link>
            </div>
            <div className="card" style={{ border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: '700' }}>운영시간 관리</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '24px', flex: 1 }}>학년별 OPEN LAB 운영 시간을 설정합니다.</p>
              <Link href="/admin/schedules" className="btn-outline" style={{ width: '100%', textAlign: 'center' }}>관리하기</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
