import Link from 'next/link';
import Logo from './Logo';
import { getSession } from '@/lib/auth';

export default async function Header() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const userName = session?.user?.name || '';

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
            {/* Small text logo instead of broken image if preferred, but user said Logo left small */}
            <Logo width={150} />
            <span style={{ 
              fontSize: '1.125rem', 
              fontWeight: '800', 
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              borderLeft: '1px solid var(--border)',
              paddingLeft: '12px'
            }}>
              NUR위한
            </span>
          </Link>
          
          <nav className="desktop-nav hide-mobile">
            <ul style={{ display: 'flex', gap: '20px' }}>
              <li><Link href="/open-lab" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>OPEN LAB 신청</Link></li>
              <li><Link href="/history" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>신청 내역</Link></li>
              <li><Link href="/notices" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>공지사항</Link></li>
              <li><Link href="/mypage" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>마이페이지</Link></li>
              {isAdmin && <li><Link href="/admin" style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--primary)' }}>관리자</Link></li>}
            </ul>
          </nav>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <span className="hide-mobile" style={{ fontSize: '0.875rem', fontWeight: '500' }}>{userName}님</span>
              <form action="/api/logout" method="POST">
                <button type="submit" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>로그아웃</button>
              </form>
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
