'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LEVELS, type Level, type Progress, type PSubject } from '../data';

const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

export default function ChecklistClient({ subject, initial }: { subject: PSubject; initial: Progress }) {
  const [prog, setProg] = useState<Progress>(initial || {});
  const [open, setOpen] = useState<string | null>(null);
  const [lv, setLv] = useState<Level>('O');
  const [date, setDate] = useState(today());
  const [onlyTodo, setOnlyTodo] = useState(false);
  const [status, setStatus] = useState<'' | 'saving' | 'saved' | 'error'>('');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus('saving');
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/practicum/${subject.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: prog }),
        });
        setStatus(r.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [prog, subject.key]);

  const total = subject.groups.reduce((n, g) => n + g.items.length, 0);
  const done = subject.groups.reduce((n, g) => n + g.items.filter(i => (prog[i.id] || []).length > 0).length, 0);
  const cnt = (l: Level) => subject.groups.reduce((n, g) => n + g.items.filter(i => (prog[i.id] || []).some(r => r.l === l)).length, 0);

  const add = (id: string) => {
    if (!date) return;
    setProg(p => {
      const list = p[id] || [];
      if (list.some(r => r.d === date && r.l === lv)) return p;
      return { ...p, [id]: [...list, { d: date, l: lv }].sort((a, b) => a.d.localeCompare(b.d)) };
    });
  };
  const del = (id: string, d: string, l: Level) =>
    setProg(p => ({ ...p, [id]: (p[id] || []).filter(r => !(r.d === d && r.l === l)) }));

  return (
    <div className="pc">
      <div className="top">
        <Link href="/practicum" className="back">실습 체크리스트</Link>
        <span className={`st ${status}`}>{status === 'saving' ? '저장 중' : status === 'saved' ? '저장됨' : status === 'error' ? '저장 실패' : ''}</span>
      </div>
      <h1>{subject.title}</h1>
      <div className="sum">
        <div className="bar"><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        <div className="nums">
          <b>{done} / {total}</b>
          {LEVELS.map(l => <span key={l.k} className={`lv ${l.k}`}>{l.label} {cnt(l.k)}</span>)}
        </div>
      </div>
      <div className="flt">
        <button type="button" className={!onlyTodo ? 'on' : ''} onClick={() => setOnlyTodo(false)}>전체</button>
        <button type="button" className={onlyTodo ? 'on' : ''} onClick={() => setOnlyTodo(true)}>미기록</button>
      </div>

      {subject.groups.map(g => {
        const items = onlyTodo ? g.items.filter(i => !(prog[i.id] || []).length) : g.items;
        if (!items.length) return null;
        const gd = g.items.filter(i => (prog[i.id] || []).length > 0).length;
        return (
          <section key={g.name} className="grp">
            <div className="gh"><b>{g.name}</b><span>{gd} / {g.items.length}</span></div>
            {items.map(it => {
              const recs = prog[it.id] || [];
              const isOpen = open === it.id;
              return (
                <div key={it.id} className={`it ${isOpen ? 'open' : ''}`}>
                  <button type="button" className="row" onClick={() => setOpen(isOpen ? null : it.id)}>
                    <span className="t">{it.t}</span>
                    <span className="pills">
                      {LEVELS.map(l => {
                        const rs = recs.filter(r => r.l === l.k);
                        if (!rs.length) return null;
                        return <em key={l.k} className={`pill ${l.k}`}>{l.label.slice(0, l.k === 'P' ? 2 : 2)} {md(rs[rs.length - 1].d)}{rs.length > 1 ? ` +${rs.length - 1}` : ''}</em>;
                      })}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="body">
                      <p className="desc">{it.d}</p>
                      <div className="rec">
                        <div className="seg">
                          {LEVELS.map(l => (
                            <button key={l.k} type="button" className={`${lv === l.k ? 'on' : ''} ${l.k}`} onClick={() => setLv(l.k)}>{l.label}</button>
                          ))}
                        </div>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                        <button type="button" className="add" onClick={() => add(it.id)}>추가</button>
                      </div>
                      {recs.length > 0 && (
                        <div className="log">
                          {LEVELS.map(l => {
                            const rs = recs.filter(r => r.l === l.k);
                            if (!rs.length) return null;
                            return (
                              <div key={l.k} className="lr">
                                <span className={`lb ${l.k}`}>{l.label}</span>
                                <span className="chs">
                                  {rs.map(r => (
                                    <span key={r.d} className="ch">{md(r.d)}<button type="button" aria-label="삭제" onClick={() => del(it.id, r.d, l.k)}>×</button></span>
                                  ))}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      <style jsx global>{`
        .pc { --o: #0E7490; --p: #B45309; --d: #15803D; }
        .pc .top { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .pc .back { color: var(--sub-text); text-decoration: none; }
        .pc .st { color: var(--sub-text); }
        .pc .st.error { color: #DC2626; }
        .pc h1 { font-size: 22px; font-weight: 800; margin: 6px 0 14px; }
        .pc .sum { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
        .pc .bar { height: 6px; background: #EEF2F7; border-radius: 3px; overflow: hidden; }
        .pc .bar i { display: block; height: 100%; background: var(--primary); }
        .pc .nums { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 10px; font-size: 13px; }
        .pc .lv.O, .pc .pill.O, .pc .lb.O { color: var(--o); }
        .pc .lv.P, .pc .pill.P, .pc .lb.P { color: var(--p); }
        .pc .lv.D, .pc .pill.D, .pc .lb.D { color: var(--d); }
        .pc .flt { display: flex; gap: 6px; margin: 14px 0 6px; }
        .pc .flt button { border: 1px solid var(--border); background: var(--white); border-radius: 999px; padding: 5px 14px; font-size: 13px; color: var(--sub-text); cursor: pointer; }
        .pc .flt button.on { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pc .grp { margin-top: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .pc .gh { display: flex; justify-content: space-between; padding: 10px 16px; background: #F1F5F9; font-size: 13px; }
        .pc .gh span { color: var(--sub-text); }
        .pc .it { border-top: 1px solid var(--border); }
        .pc .row { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 16px; background: none; border: 0; text-align: left; cursor: pointer; font: inherit; color: inherit; }
        .pc .t { font-size: 14px; line-height: 1.4; }
        .pc .pills { display: flex; gap: 4px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        .pc .pill { font-style: normal; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: #F1F5F9; white-space: nowrap; }
        .pc .it.open { background: #FAFCFF; }
        .pc .body { padding: 0 16px 14px; }
        .pc .desc { margin: 0 0 12px; font-size: 13px; line-height: 1.65; color: #334155; }
        .pc .rec { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .pc .seg { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .pc .seg button { border: 0; background: var(--white); padding: 7px 12px; font-size: 13px; cursor: pointer; color: var(--sub-text); }
        .pc .seg button + button { border-left: 1px solid var(--border); }
        .pc .seg button.on.O { background: var(--o); color: #fff; }
        .pc .seg button.on.P { background: var(--p); color: #fff; }
        .pc .seg button.on.D { background: var(--d); color: #fff; }
        .pc .rec input { border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px; font: inherit; font-size: 13px; }
        .pc .add { border: 0; background: var(--primary); color: #fff; border-radius: 8px; padding: 7px 14px; font-size: 13px; cursor: pointer; }
        .pc .log { margin-top: 12px; display: grid; gap: 6px; }
        .pc .lr { display: flex; gap: 10px; align-items: flex-start; }
        .pc .lb { font-size: 12px; font-weight: 700; width: 52px; flex-shrink: 0; padding-top: 4px; }
        .pc .chs { display: flex; flex-wrap: wrap; gap: 5px; }
        .pc .ch { display: inline-flex; align-items: center; gap: 4px; background: #F1F5F9; border-radius: 999px; padding: 3px 4px 3px 10px; font-size: 13px; }
        .pc .ch button { border: 0; background: none; color: var(--sub-text); cursor: pointer; font-size: 14px; line-height: 1; padding: 0 4px; }
      `}</style>
    </div>
  );
}
