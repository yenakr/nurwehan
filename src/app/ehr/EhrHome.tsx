'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SAMPLES } from './samples';
import { emptyChart } from './types';

type Item = { id: string; title: string; subject: string | null; updatedAt: string };

const fmt = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function EhrHome({ cases }: { cases: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [list, setList] = useState(cases);

  const create = async (title: string, subject: string | null, data: unknown) => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/ehr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject, data }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.id) throw new Error();
      router.push(`/ehr/${j.id}`);
    } catch {
      setErr('만들지 못했어요. 저장 테이블이 준비됐는지 확인해 주세요.');
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('이 차트를 삭제할까요? 되돌릴 수 없어요.')) return;
    const res = await fetch(`/api/ehr/${id}`, { method: 'DELETE' });
    if (res.ok) setList(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="ehrHome">
      <h1>EHR 연습</h1>

      <section>
        <h2>새 차트</h2>
        <div className="grid">
          <button type="button" className="tile blank" disabled={busy} onClick={() => create('새 차트', null, emptyChart())}>
            <b>빈 차트</b>
            <span>직접 입력</span>
          </button>
          {SAMPLES.map(s => (
            <button key={s.key} type="button" className="tile" disabled={busy} onClick={() => create(s.title, s.subject, s.data)}>
              <b>{s.subject}</b>
              <span>{s.title.split(' · ')[1]}</span>
            </button>
          ))}
        </div>
        {err && <p className="err">{err}</p>}
      </section>

      <section>
        <h2>내 차트</h2>
        {list.length === 0 ? (
          <p className="empty">아직 없어요.</p>
        ) : (
          <ul className="list">
            {list.map(c => (
              <li key={c.id}>
                <Link href={`/ehr/${c.id}`}>
                  <span className="t">{c.title}</span>
                  <span className="m">{c.subject ? `${c.subject} · ` : ''}{fmt(c.updatedAt)}</span>
                </Link>
                <button type="button" aria-label="삭제" onClick={() => remove(c.id)}>삭제</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <style jsx global>{`
        .ehrHome h1 { font-size: 1.375rem; font-weight: 800; color: var(--text); margin: 0 0 18px; }
        .ehrHome h2 { font-size: 0.8125rem; font-weight: 700; color: var(--sub-text); margin: 0 0 8px; }
        .ehrHome section { margin-bottom: 26px; }
        .ehrHome .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
        .ehrHome .tile { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; text-align: left; padding: 14px; background: #fff; border: 1px solid var(--border); border-radius: 12px; font-family: inherit; cursor: pointer; }
        .ehrHome .tile b { font-size: 0.9375rem; color: var(--primary); }
        .ehrHome .tile span { font-size: 0.8125rem; color: var(--sub-text); }
        .ehrHome .tile.blank { border-style: dashed; }
        .ehrHome .tile:disabled { opacity: 0.6; }
        .ehrHome .err { color: #b91c1c; font-size: 0.8125rem; margin-top: 8px; }
        .ehrHome .empty { color: var(--sub-text); font-size: 0.875rem; }
        .ehrHome .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .ehrHome .list li { display: flex; align-items: center; background: #fff; border: 1px solid var(--border); border-radius: 10px; }
        .ehrHome .list a { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; text-decoration: none; }
        .ehrHome .list .t { font-weight: 700; color: var(--text); font-size: 0.9375rem; }
        .ehrHome .list .m { font-size: 0.75rem; color: var(--sub-text); }
        .ehrHome .list button { border: 0; background: transparent; color: var(--sub-text); font-size: 0.8125rem; padding: 12px 14px; font-family: inherit; cursor: pointer; }
      `}</style>
    </div>
  );
}
