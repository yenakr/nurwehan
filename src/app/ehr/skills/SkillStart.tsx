'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { guideOf } from './scn';

export default function SkillStart({ startKey, skill, title, goal, exam, custom, patient, tries }: { startKey: string; skill: string; title: string; goal: string; exam: boolean; custom: boolean; patient: string; tries: { id: string; at: string; done: boolean }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState(tries);
  const [err, setErr] = useState('');
  const start = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/ehr/skills/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: startKey }) });
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
      <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{title}{exam && <span style={{ marginLeft: 8, fontSize: 12, background: '#dc2626', color: '#fff', borderRadius: 999, padding: '2px 10px', verticalAlign: 'middle' }}>시험</span>}</h1>
      <p style={{ margin: '0 0 14px', color: 'var(--muted-foreground)' }}>{goal}</p>
      <div style={box}>
        <b>환자</b>
        <p style={{ margin: '4px 0 0' }}>{patient}</p>
        <p style={{ margin: '10px 0 4px' }}><b>이렇게 진행해요</b></p>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>{guideOf(skill).map((g, i) => <li key={i}>{g}</li>)}</ol>
        {exam && <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted-foreground)' }}>시험 모드예요. 수행 후 가이드 패널의 [제출]을 눌러요.</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={start} disabled={busy} style={{ padding: '9px 18px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14 }}>{busy ? '여는 중…' : exam ? '시험 시작' : '새로 연습 시작'}</button>
        </div>
        {err && <p style={{ color: '#dc2626', margin: '8px 0 0' }}>{err}</p>}
      </div>
      {list.length > 0 && (
        <div style={box}>
          <b>이어하기</b>
          {list.map(t => (
            <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--border)', marginTop: 6 }}>
              <span style={{ flex: 1 }}>{new Date(t.at).toLocaleString('ko-KR')}{t.done ? ' · 제출함' : ''}</span>
              <Link href={`/ehr/${t.id}`}>열기</Link>
              <button type="button" onClick={() => del(t.id)} style={{ border: 0, background: 'none', color: '#dc2626', cursor: 'pointer' }}>삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
