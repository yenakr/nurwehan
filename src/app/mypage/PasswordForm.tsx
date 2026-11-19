'use client';

import { useState } from 'react';

export default function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState('');
  const [nxt, setNxt] = useState('');
  const [again, setAgain] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (nxt !== again) { setMsg('새 비밀번호가 서로 달라요.'); return; }
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: cur, next: nxt }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setCur(''); setNxt(''); setAgain(''); setOpen(false);
        alert('비밀번호를 바꿨어요.');
      } else {
        setMsg(j.message || '바꾸지 못했어요.');
      }
    } catch {
      setMsg('서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mp-card" style={{ marginTop: 12 }}>
      <div className="mp-head">
        <h2>비밀번호</h2>
        {!open && <button type="button" className="mp-btn ghost" onClick={() => setOpen(true)}>변경</button>}
      </div>
      {open && (
        <div className="pw-box">
          <input type="password" autoComplete="current-password" placeholder="현재 비밀번호" value={cur} onChange={e => setCur(e.target.value)} />
          <input type="password" autoComplete="new-password" placeholder="새 비밀번호 (8자 이상)" value={nxt} onChange={e => setNxt(e.target.value)} />
          <input type="password" autoComplete="new-password" placeholder="새 비밀번호 확인" value={again} onChange={e => setAgain(e.target.value)} />
          {msg && <p className="pw-msg">{msg}</p>}
          <div className="pw-acts">
            <button type="button" className="mp-btn" onClick={save} disabled={busy || !cur || !nxt || !again}>저장</button>
            <button type="button" className="mp-btn ghost" onClick={() => { setOpen(false); setMsg(''); }} disabled={busy}>취소</button>
          </div>
        </div>
      )}
      <style>{`
        .pw-box{display:flex;flex-direction:column;gap:8px}
        .pw-box input{width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.875rem;background:#fff}
        .pw-msg{margin:0;font-size:.8125rem;color:#c0392b}
        .pw-acts{display:flex;gap:6px}
      `}</style>
    </section>
  );
}
