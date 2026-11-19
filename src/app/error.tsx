'use client';

import Link from 'next/link';

export default function Error({
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  return (
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>잠시 문제가 생겼어요</h2>
        <p style={{ color: 'var(--sub-text)', marginBottom: '24px', fontSize: '0.9375rem' }}>
          잠시 후 다시 시도해 주세요.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={() => (unstable_retry ?? reset)?.()}>다시 시도</button>
          <Link href="/" className="btn-primary" style={{ display: 'inline-block', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--border)' }}>홈으로</Link>
        </div>
      </div>
    </main>
  );
}
