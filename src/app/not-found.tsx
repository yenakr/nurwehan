import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '16px' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>페이지를 찾을 수 없습니다</h2>
        <p style={{ color: 'var(--sub-text)', marginBottom: '32px', fontSize: '0.9375rem' }}>
          요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다.
        </p>
        <Link href="/" className="btn-primary" style={{ display: 'inline-block' }}>
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
