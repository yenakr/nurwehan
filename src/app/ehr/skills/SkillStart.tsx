'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { scenarioOf } from './data';
import { GUIDE } from './guide';

export default function SkillStart({ skillKey, tries }: { skillKey: string; tries: { id: string; at: string }[] }) {
  const sc = scenarioOf(skillKey)!;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState(tries);
  const [err, setErr] = useState('');
  const start = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/ehr/skills/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: skillKey }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.id) router.push(`/ehr/${j.id}`); else { setErr('시작하지 못했어요'); setBusy(false); }
    } catch { setErr('시작하지 못했어요'); setBusy(false); }
  };
  const del = async (id: string) => {
    if (!confirm('이 연습 기록을 지울까요?')) return;
    const r = await fetch(`/api/ehr/${id}`, { method: 'DELETE' });
    if (r.ok) setList(l => l.filter(x => x.id !== id));
  };
  const box = { background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 12 } as const;
  return (
    <div style={{ fontSize: 14 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{sc.title}</h1>
      <p style={{ margin: '0 0 14px', color: 'var(--muted-foreground)' }}>{sc.goal}</p>
      <div style={box}>
        <b>환자</b>
        <p style={{ margin: '4px 0 0' }}>{sc.patient.name} · {sc.patient.line} · {sc.patient.dx} · 알레르기 {sc.patient.allergy}</p>
        <p style={{ margin: '10px 0 4px' }}><b>이렇게 진행해요</b></p>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>{GUIDE[skillKey].map((g, i) => <li key={i}>{g}</li>)}</ol>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted-foreground)' }}>실제 EHR 화면에서 입력하고, 화면 오른쪽 가이드 패널의 체크리스트가 실시간으로 채워져요. 이 연습 차트는 자율 EHR과 완전히 분리돼 있어요.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={start} disabled={busy} style={{ padding: '9px 18px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14 }}>{busy ? '여는 중…' : '새로 연습 시작'}</button>
          <Link href={`/ehr/skills/${skillKey}/quiz`} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>먼저 개념 퀴즈</Link>
        </div>
        {err && <p style={{ color: '#dc2626', margin: '8px 0 0' }}>{err}</p>}
      </div>
      {list.length > 0 && (
        <div style={box}>
          <b>이어하기</b>
          {list.map(t => (
            <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--border)', marginTop: 6 }}>
              <span style={{ flex: 1 }}>{new Date(t.at).toLocaleString('ko-KR')}</span>
              <Link href={`/ehr/${t.id}`}>열기</Link>
              <button type="button" onClick={() => del(t.id)} style={{ border: 0, background: 'none', color: '#dc2626', cursor: 'pointer' }}>삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
