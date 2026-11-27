'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExamEntry({ list }: { list: { id: string; title: string; skill: string }[] }) {
  const router = useRouter();
  const [scn, setScn] = useState(list[0]?.id || '');
  const [no, setNo] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const inp = { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'inherit', width: '100%', fontSize: 15 } as const;
  const go = async () => {
    setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/ehr/skills/exam', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scn, no, name }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.id) { router.push(`/ehr/${j.id}`); return; }
      setErr(j.error === 'name' ? '이 학번으로 이미 다른 이름이 입력돼 있어요. 학번과 이름을 확인해 주세요.' : j.error === 'input' ? '학번(4자 이상)과 이름을 정확히 입력해 주세요.' : '시작하지 못했어요. 시험이 열려 있는지 확인해 주세요.');
    } catch { setErr('시작하지 못했어요.'); }
    setBusy(false);
  };
  return (
    <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 22, textAlign: 'center' }}>핵심술기 수행평가</h1>
      {list.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>지금 열려 있는 시험이 없어요.</p> : (
        <>
          {list.length > 1 && (
            <select style={inp} value={scn} onChange={e => setScn(e.target.value)}>{list.map(l => <option key={l.id} value={l.id}>{l.title} ({l.skill})</option>)}</select>
          )}
          <input style={inp} value={no} onChange={e => setNo(e.target.value)} placeholder="학번" inputMode="numeric" autoComplete="off" />
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="이름" autoComplete="off" onKeyDown={e => { if (e.key === 'Enter' && !busy) go(); }} />
          {err && <p style={{ margin: 0, color: '#dc2626', fontSize: 13 }}>{err}</p>}
          <button type="button" onClick={go} disabled={busy || !no || !name} style={{ padding: '12px', borderRadius: 10, border: 0, background: '#16a34a', color: '#fff', fontSize: 16, cursor: 'pointer', opacity: busy || !no || !name ? 0.5 : 1 }}>{busy ? '여는 중…' : '시험 시작'}</button>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)', textAlign: 'center' }}>같은 학번으로 다시 들어오면 이어서 볼 수 있어요.</p>
        </>
      )}
    </div>
  );
}
