'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { COURSES, LEVELS, SUBJECTS, type Level, type Progress, type PSubject } from './practicum-data';

const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

export default function Checklist({
  all,
  setAll,
  noteDates,
  onPickDay,
  defaultCourse,
}: {
  defaultCourse?: string;
  all: Record<string, Progress>;
  setAll: Dispatch<SetStateAction<Record<string, Progress>>>;
  noteDates: Set<string>;
  onPickDay: (d: string) => void;
}) {
  const [course, setCourse] = useState(COURSES.some(c => c.key === defaultCourse) ? (defaultCourse as string) : COURSES[0].key);
  const subjects = SUBJECTS.filter(s => s.course === course);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const key = subjects.find(s => s.key === keys[course])?.key ?? subjects[0].key;
  const subject = subjects.find(s => s.key === key) as PSubject;
  const prog = all[key] || {};
  const setProg = (fn: (p: Progress) => Progress) => {
    setAll(a => ({ ...a, [key]: fn(a[key] || {}) }));
    setDirty(key);
  };
  const [dirty, setDirty] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [gOpen, setGOpen] = useState<Record<string, boolean>>({});
  const [lv, setLv] = useState<Level>('O');
  const [date, setDate] = useState(today());
  const [onlyTodo, setOnlyTodo] = useState(false);
  const [status, setStatus] = useState<'' | 'saving' | 'saved' | 'error'>('');

  useEffect(() => {
    if (!dirty) return;
    setStatus('saving');
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/practicum/${dirty}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: all[dirty] || {} }),
        });
        setStatus(r.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [all, dirty]);

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
        <div className="subj">
          {COURSES.map(c => (
            <button key={c.key} type="button" className={c.key === course ? 'on' : ''} onClick={() => { setCourse(c.key); setOpen(null); }}>{c.label}</button>
          ))}
        </div>
        <span className={`st ${status}`}>{status === 'saving' ? '저장 중' : status === 'saved' ? '저장됨' : status === 'error' ? '저장 실패' : ''}</span>
      </div>
      {subjects.length > 1 && (
        <div className="subj sub2">
          {subjects.map(x => (
            <button key={x.key} type="button" className={x.key === key ? 'on' : ''} onClick={() => { setKeys(k => ({ ...k, [course]: x.key })); setOpen(null); }}>{x.sub}</button>
          ))}
        </div>
      )}
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
        {!onlyTodo && (
          <button type="button" className="all" onClick={() => {
            const allOpen = subject.groups.every(g => gOpen[`${subject.key}:${g.name}`]);
            setGOpen(o => ({ ...o, ...Object.fromEntries(subject.groups.map(g => [`${subject.key}:${g.name}`, !allOpen])) }));
          }}>{subject.groups.every(g => gOpen[`${subject.key}:${g.name}`]) ? '모두 접기' : '모두 펼치기'}</button>
        )}
      </div>

      {subject.groups.map(g => {
        const items = onlyTodo ? g.items.filter(i => !(prog[i.id] || []).length) : g.items;
        if (!items.length) return null;
        const gk = `${subject.key}:${g.name}`;
        const showG = !!gOpen[gk] || onlyTodo;
        const gd = g.items.filter(i => (prog[i.id] || []).length > 0).length;
        return (
          <section key={g.name} className="grp">
            <button type="button" className="gh" onClick={() => setGOpen(o => ({ ...o, [gk]: !o[gk] }))}>
              <b>{g.name}</b>
              <span>{gd} / {g.items.length}<i className={`cv ${showG ? 'up' : ''}`} /></span>
            </button>
            {showG && items.map(it => {
              const recs = prog[it.id] || [];
              const isOpen = open === it.id;
              return (
                <div key={it.id} className={`it ${isOpen ? 'open' : ''}`}>
                  <button type="button" className="row" onClick={() => setOpen(isOpen ? null : it.id)}>
                    <span className="t">{it.t}</span>
                    {recs.length > 0 && (
                      <span className="dl">
                        {LEVELS.map(l => {
                          const rs = recs.filter(r => r.l === l.k);
                          if (!rs.length) return null;
                          return (
                            <span key={l.k} className="dr">
                              <b className={`lb ${l.k}`}>{l.label}</b>
                              {rs.map(r => <i key={r.d}>{md(r.d)}</i>)}
                            </span>
                          );
                        })}
                      </span>
                    )}
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
                                    <span key={r.d} className="ch">
                                      <button type="button" className="dt" title="그날 메모 보기" onClick={() => onPickDay(r.d)}>{md(r.d)}{noteDates.has(r.d) ? ' · 메모' : ''}</button>
                                      <button type="button" aria-label="삭제" onClick={() => del(it.id, r.d, l.k)}>×</button>
                                    </span>
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
        .pc .top { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 14px; }
        .pc .sub2 { margin-bottom: 12px; }
        .pc .sub2 button { font-size: 13px; padding: 5px 12px; }
        .pc .subj { display: flex; gap: 6px; flex-wrap: wrap; }
        .pc .subj button { border: 1px solid var(--border); background: var(--white); border-radius: 999px; padding: 6px 14px; font-size: 14px; font-weight: 600; color: var(--sub-text); cursor: pointer; }
        .pc .subj button.on { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pc .dl { display: flex; flex-direction: column; gap: 3px; }
        .pc .dr { display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: baseline; }
        .pc .dr .lb { width: 52px; font-size: 12px; padding: 0; }
        .pc .dr i { font-style: normal; font-size: 12.5px; font-weight: 600; background: rgba(127,127,127,.16); border-radius: 6px; padding: 1px 7px; color: var(--text); }
        .pc .ch .dt { font-size: 13px; color: var(--text); padding: 0; }
        .pc .st { color: var(--sub-text); }
        .pc .st.error { color: #DC2626; }
        .pc h1 { font-size: 22px; font-weight: 800; margin: 6px 0 14px; }
        .pc .sum { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
        .pc .bar { height: 6px; background: rgba(127,127,127,.2); border-radius: 3px; overflow: hidden; }
        .pc .bar i { display: block; height: 100%; background: var(--primary); }
        .pc .nums { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 10px; font-size: 13px; }
        .pc .lv.O, .pc .pill.O, .pc .lb.O { color: var(--o); }
        .pc .lv.P, .pc .pill.P, .pc .lb.P { color: var(--p); }
        .pc .lv.D, .pc .pill.D, .pc .lb.D { color: var(--d); }
        .pc .flt { display: flex; gap: 6px; margin: 14px 0 6px; }
        .pc .flt button { border: 1px solid var(--border); background: var(--white); border-radius: 999px; padding: 5px 14px; font-size: 13px; color: var(--sub-text); cursor: pointer; }
        .pc .flt button.on { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pc .flt .all { margin-left: auto; border: 0; background: none; }
        .pc .grp { margin-top: 10px; background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .pc .gh { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(127,127,127,.12); font: inherit; font-size: 14px; color: inherit; border: 0; cursor: pointer; text-align: left; }
        .pc .gh span { display: flex; align-items: center; gap: 8px; }
        .pc .cv { width: 7px; height: 7px; border-right: 2px solid var(--sub-text); border-bottom: 2px solid var(--sub-text); transform: rotate(45deg); margin-top: -3px; }
        .pc .cv.up { transform: rotate(-135deg); margin-top: 3px; }
        .pc .gh span { color: var(--sub-text); }
        .pc .it { border-top: 1px solid var(--border); }
        .pc .row { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 10px 16px; background: none; border: 0; text-align: left; cursor: pointer; font: inherit; color: inherit; }
        .pc .t { font-size: 14px; line-height: 1.35; }
        .pc .pills { display: flex; gap: 4px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        .pc .pill { font-style: normal; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: rgba(127,127,127,.16); white-space: nowrap; }
        .pc .it.open { background: rgba(127,127,127,.05); }
        .pc .body { padding: 0 16px 14px; }
        .pc .desc { margin: 0 0 12px; font-size: 13px; line-height: 1.65; color: var(--text); }
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
        .pc .ch { display: inline-flex; align-items: center; gap: 4px; background: rgba(127,127,127,.16); border-radius: 999px; padding: 3px 4px 3px 10px; font-size: 13px; }
        .pc .ch button { border: 0; background: none; color: var(--sub-text); cursor: pointer; font-size: 14px; line-height: 1; padding: 0 4px; }
      `}</style>
    </div>
  );
}
