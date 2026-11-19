import Link from 'next/link';

export default function FindPw() {
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '48px 0' }}>
      <div className="container" style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 10px' }}>비밀번호 찾기</h1>
        <p style={{ color: 'var(--sub-text)', lineHeight: 1.6, margin: '0 0 24px' }}>
          관리자에게 초기화를 요청해 주세요.<br />임시 비밀번호로 로그인한 뒤 마이페이지에서 바꿀 수 있어요.
        </p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>로그인으로</Link>
      </div>
    </main>
  );
}
