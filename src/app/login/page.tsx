import Header from '@/components/Header';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>NUR위한</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>한양대학교 간호대학 학과 내부 시스템</p>
          </div>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>학번 / 아이디</label>
              <input type="text" placeholder="202XXXXXXX" style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>비밀번호</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} />
            </div>
            <button className="btn-primary" style={{ padding: '12px', marginTop: '8px' }}>로그인</button>
          </form>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
            <Link href="#">비밀번호 초기화</Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <Link href="/register">회원가입</Link>
          </div>
        </div>
      </main>
    </>
  );
}
