import Link from 'next/link';
import Logo from './Logo';

export default function Header() {
  // TODO: 실제 인증 상태 연동
  const isLoggedIn = false; 
  const isAdmin = false;

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--white)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo width={150} />
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: '800', 
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              borderLeft: '1px solid var(--border)',
              paddingLeft: '12px'
            }}>
              NUR위한
            </span>
          </Link>
          
          <nav>
            <ul style={{ display: 'flex', gap: '20px' }}>
              <li>
                <Link href="/open-lab" style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text)' }}>
                  OPEN LAB 신청
                </Link>
              </li>
              <li>
                <Link href="/history" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>
                  신청 내역
                </Link>
              </li>
              <li>
                <Link href="/notices" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/mypage" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>
                  마이페이지
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/admin" style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--primary)' }}>
                    관리자
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>홍길동 학생님</span>
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>로그아웃</button>
            </>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.875rem' }}>
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
