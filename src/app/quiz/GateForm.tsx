'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GateForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/quiz/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      setError('코드가 올바르지 않습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 320, margin: '48px auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>퀴즈</h1>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--sub-text)' }}>코드를 입력하거나 로그인하면 이용할 수 있어요.</p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        aria-label="코드"
        placeholder="코드"
        value={code}
        onChange={e => setCode(e.target.value)}
        style={{ padding: 12, fontSize: '1rem', border: '1px solid #CBD5E1', borderRadius: 8 }}
      />
      {error && <div role="alert" style={{ color: '#B91C1C', fontSize: '0.875rem' }}>{error}</div>}
      <button type="submit" className="btn-primary" disabled={busy || !code.trim()} style={{ padding: 12 }}>확인</button>
      <a href="/login" style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--sub-text)' }}>로그인</a>
    </form>
  );
}
