import Logo from './Logo';

export default function Header() {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--white)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Logo width={200} />
          
          <nav>
            <ul style={{ display: 'flex', gap: '24px' }}>
              <li>
                <Link href="/open-lab" style={{ fontSize: '0.9375rem', fontWeight: '500' }}>
                  OPEN LAB 신청
                </Link>
              </li>
              <li>
                <Link href="/history" style={{ fontSize: '0.9375rem', fontWeight: '500' }}>
                  신청 내역
                </Link>
              </li>
              <li>
                <Link href="/notices" style={{ fontSize: '0.9375rem', fontWeight: '500' }}>
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/admin" style={{ fontSize: '0.9375rem', fontWeight: '500' }}>
                  관리자
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>로그인이 필요합니다</span>
          <Link href="/login" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
