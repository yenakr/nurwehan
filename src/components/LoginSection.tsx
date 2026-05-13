import Link from 'next/link';
import Image from 'next/image';

export default function LoginSection() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ 
        position: 'absolute', 
        top: '-10px', 
        right: '-10px', 
        width: '100px', 
        height: '100px', 
        opacity: 0.8,
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <Image 
          src="/hylion-nursing.png" 
          alt="하리온 간호대학 버전" 
          width={100} 
          height={100} 
          style={{ objectFit: 'contain' }}
        />
      </div>
      
      <div className="section-title" style={{ marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        <span>시스템 접속</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '4px' }}>
        한양대학교 포털 계정으로 로그인하여 서비스를 이용하실 수 있습니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link href="/login/student" className="btn-primary" style={{ 
          textAlign: 'center', 
          padding: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px'
        }}>
          학생 로그인
        </Link>
        <Link href="/login/admin" className="btn-outline" style={{ 
          textAlign: 'center', 
          padding: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px'
        }}>
          관리자 로그인
        </Link>
      </div>
      <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/find-pw" style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>비밀번호 찾기</Link>
        <Link href="/help" style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>이용 문의</Link>
      </div>
    </div>
  );
}
