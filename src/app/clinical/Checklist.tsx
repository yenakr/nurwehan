'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { COURSES, LEVELS, SUBJECTS, type Level, type Progress, type PSubject, type PItem, type Rec, type Store } from './practicum-data';

const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
const lbl = (l: Level) => LEVELS.find(x => x.k === l)?.label ?? '';
const rank: Record<Level, number> = { O: 1, P: 2, D: 3 };
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// 날짜 오름차순 (같은 날은 입력 순서 유지)
const chrono = (recs: Rec[]) => recs.map((r, i) => ({ r, i })).sort((a, b) => a.r.d.localeCompare(b.r.d) || a.i - b.i).map(x => x.r);
const top = (recs: Rec[]): Level | null => (recs.length ? recs.reduce((m, r) => (rank[r.l] > rank[m] ? r.l : m), recs[0].l) : null);

type Filter = 'all' | 'todo' | 'done';

export default function Checklist({
  all,
  setAll,
  noteDates,
  onPickDay,
  defaultCourse,
}: {
  defaultCourse?: string;
  all: Record<string, Store>;
  setAll: Dispatch<SetStateAction<Record<string, Store>>>;
  noteDates: Set<string>;
  onPickDay: (d: string) => void;
}) {
  const [course, setCourse] = useState(COURSES.some(c => c.key === defaultCourse) ? (defaultCourse as string) : COURSES[0].key);
  const subjects = SUBJECTS.filter(s => s.course === course);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const key = subjects.find(s => s.key === keys[course])?.key ?? subjects[0].key;
  const subject = subjects.find(s => s.key === key) as PSubject;
  const prog: Progress = all[key]?.r || {};
  const remarks = all[key]?.n || {};

  const [dirty, setDirty] = useState<string | null>(null);
  const [status, setStatus] = useState<'' | 'saving' | 'saved' | 'error'>('');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [find, setFind] = useState(false);
  const [sheet, setSheet] = useState<PItem | null>(null);
  // 시트 입력 상태
  const [lv, setLv] = useState<Level>('O');
  const [date, setDate] = useState(today());
  const [memo, setMemo] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [ed, setEd] = useState<{ l: Level; d: string; m: string }>({ l: 'O', d: today(), m: '' });
  const [delId, setDelId] = useState<string | null>(null);

  const mutate = (fn: (r: Progress) => Progress) => {
    setAll(a => ({ ...a, [key]: { r: fn(a[key]?.r || {}), n: a[key]?.n || {} } }));
    setDirty(key);
  };
  const setRemark = (id: string, v: string) => {
    setAll(a => ({ ...a, [key]: { r: a[key]?.r || {}, n: { ...(a[key]?.n || {}), [id]: v.slice(0, 200) } } }));
    setDirty(key);
  };

  useEffect(() => {
    if (!dirty) return;
    setStatus('saving');
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/practicum/${dirty}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: all[dirty] || { r: {}, n: {} } }),
        });
        setStatus(r.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [all, dirty]);

  // 시트가 열려 있는 동안 뒤 화면 스크롤 잠금
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  const total = subject.groups.reduce((n, g) => n + g.items.length, 0);
  const itemsAll = subject.groups.flatMap(g => g.items);
  const done = itemsAll.filter(i => (prog[i.id] || []).length > 0).length;
  const cnt = (l: Level) => itemsAll.filter(i => top(prog[i.id] || []) === l).length;

  const query = q.trim().toLowerCase();
  const visible = useMemo(
    () =>
      subject.groups
        .map(g => ({
          g,
          items: g.items.filter(i => {
            const has = (prog[i.id] || []).length > 0;
            if (filter === 'todo' && has) return false;
            if (filter === 'done' && !has) return false;
            if (query && !i.t.toLowerCase().includes(query)) return false;
            return true;
          }),
        }))
        .filter(x => x.items.length > 0),
    [subject, prog, filter, query]
  );

  const openSheet = (it: PItem) => {
    setSheet(it);
    setLv('O');
    setDate(today());
    setMemo('');
    setEditId(null);
    setDelId(null);
  };

  const add = () => {
    if (!sheet || !date) return;
    const rec: Rec = { id: newId(), d: date, l: lv, ...(memo.trim() ? { m: memo.trim().slice(0, 200) } : {}) };
    mutate(r => ({ ...r, [sheet.id]: [...(r[sheet.id] || []), rec] }));
    setMemo('');
  };
  const startEdit = (r: Rec) => {
    setEditId(r.id);
    setEd({ l: r.l, d: r.d, m: r.m || '' });
    setDelId(null);
  };
  const saveEdit = () => {
    if (!sheet || !editId || !ed.d) return;
    mutate(r => ({
      ...r,
      [sheet.id]: (r[sheet.id] || []).map(x => (x.id === editId ? { id: x.id, d: ed.d, l: ed.l, ...(ed.m.trim() ? { m: ed.m.trim().slice(0, 200) } : {}) } : x)),
    }));
    setEditId(null);
  };
  const del = (id: string) => {
    if (!sheet) return;
    mutate(r => {
      const rest = (r[sheet.id] || []).filter(x => x.id !== id);
      const next = { ...r };
      if (rest.length) next[sheet.id] = rest;
      else delete next[sheet.id];
      return next;
    });
    setDelId(null);
  };

  const seg = (v: Level, on: (l: Level) => void) => (
    <div className="seg">
      {LEVELS.map(l => (
        <button key={l.k} type="button" className={`${v === l.k ? 'on' : ''} ${l.k}`} onClick={() => on(l.k)}>{l.label}</button>
      ))}
    </div>
  );

  const sheetRecs = sheet ? prog[sheet.id] || [] : [];
  const history = sheetRecs.map((r, i) => ({ r, i })).sort((a, b) => b.r.d.localeCompare(a.r.d) || b.i - a.i).map(x => x.r);

  return (
    <div className="pc">
      <div className="top">
        <div className="ct">
          {COURSES.map(c => (
            <button key={c.key} type="button" className={c.key === course ? 'on' : ''} onClick={() => { setCourse(c.key); setFilter('all'); setQ(''); }}>{c.label}</button>
          ))}
        </div>
        {status === 'saving' && <span className="st">저장 중</span>}
        {status === 'error' && <span className="st error">저장 실패</span>}
        <button type="button" className={`ic ${find || q || filter !== 'all' ? 'on' : ''}`} aria-label="검색" onClick={() => setFind(f => !f)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </button>
      </div>
      {find && (
        <div className="tools">
          <input type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} />
          <div className="flt">
            {([['all', '전체'], ['todo', '미기록'], ['done', '기록완료']] as [Filter, string][]).map(([k, t]) => (
              <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{t}</button>
            ))}
          </div>
        </div>
      )}
      {subjects.length > 1 && (
        <div className="hs">
          {subjects.map(x => (
            <button key={x.key} type="button" className={x.key === key ? 'on' : ''} onClick={() => { setKeys(k => ({ ...k, [course]: x.key })); setFilter('all'); setQ(''); }}>{x.sub}</button>
          ))}
        </div>
      )}

      {visible.map(({ g, items }) => {
        const gd = g.items.filter(i => (prog[i.id] || []).length > 0).length;
        return (
          <section key={g.name} className="grp">
            <div className="gh"><b>{g.name}</b><span>{gd}/{g.items.length}</span></div>
            {items.map(it => {
              const recs = chrono(prog[it.id] || []);
              const last = recs.slice(-2);
              return (
                <button key={it.id} type="button" className="row" onClick={() => openSheet(it)}>
                  <span className="t">{it.t}</span>
                  {recs.length > 0 && (
                    <span className="sm">
                      {last.map((r, i) => (
                        <span key={r.id}>{i > 0 && ' · '}<b className={`lb ${r.l}`}>{lbl(r.l)}</b> {md(r.d)}</span>
                      ))}
                      {' · '}총 {recs.length}회
                    </span>
                  )}
                </button>
              );
            })}
          </section>
        );
      })}

      <div className="foot">
        <b>{done}/{total}</b>
        {LEVELS.map(l => <span key={l.k} className={`lv ${l.k}`}>{l.label} {cnt(l.k)}</span>)}
      </div>

      {sheet && (
        <div className="ov" onClick={() => setSheet(null)}>
          <div className="sheet" role="dialog" aria-label={sheet.t} onClick={e => e.stopPropagation()}>
            <div className="sh">
              <div>
                <h3>{sheet.t}</h3>
                <span className="cnt">총 {sheetRecs.length}회</span>
              </div>
              <button type="button" className="x" aria-label="닫기" onClick={() => setSheet(null)}>×</button>
            </div>
            <p className="desc">{sheet.d}</p>

            <div className="blk">
              <div className="bt">새 기록 추가</div>
              {seg(lv, setLv)}
              <div className="frow">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <input className="grow" value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모" maxLength={200} />
              </div>
              <button type="button" className="add" onClick={add}>추가</button>
            </div>

            <div className="blk">
              <div className="bt">기록 내역</div>
              {history.map(r =>
                editId === r.id ? (
                  <div key={r.id} className="hr edit">
                    {seg(ed.l, l => setEd(e => ({ ...e, l })))}
                    <div className="frow">
                      <input type="date" value={ed.d} onChange={e => setEd(x => ({ ...x, d: e.target.value }))} />
                      <input className="grow" value={ed.m} onChange={e => setEd(x => ({ ...x, m: e.target.value }))} placeholder="메모" maxLength={200} />
                    </div>
                    <div className="acts">
                      <button type="button" onClick={() => setEditId(null)}>취소</button>
                      <button type="button" className="pri" onClick={saveEdit}>저장</button>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} className="hr">
                    <button type="button" className="hd" title="그날 실습메모 보기" onClick={() => { setSheet(null); onPickDay(r.d); }}>
                      {md(r.d)}{noteDates.has(r.d) ? <i> · 메모</i> : null}
                    </button>
                    <b className={`lb ${r.l}`}>{lbl(r.l)}</b>
                    {r.m && <span className="hm">{r.m}</span>}
                    <span className="acts">
                      {delId === r.id ? (
                        <>
                          <button type="button" className="dng" onClick={() => del(r.id)}>삭제 확인</button>
                          <button type="button" onClick={() => setDelId(null)}>취소</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(r)}>수정</button>
                          <button type="button" onClick={() => setDelId(r.id)}>삭제</button>
                        </>
                      )}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="blk">
              <div className="bt">비고</div>
              <input className="rmi" value={remarks[sheet.id] || ''} onChange={e => setRemark(sheet.id, e.target.value)} maxLength={200} />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .pc { --o: #0E7490; --p: #B45309; --d: #15803D; --line: var(--border); --tint: rgba(127,127,127,.14); }
        .pc .top { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--line); margin-bottom: 10px; }
        .pc .ct { flex: 1; min-width: 0; display: flex; gap: 18px; overflow-x: auto; white-space: nowrap; scrollbar-width: none; }
        .pc .ct::-webkit-scrollbar, .pc .hs::-webkit-scrollbar { display: none; }
        .pc .ct button { flex-shrink: 0; border: 0; border-bottom: 2px solid transparent; background: none; padding: 8px 0; font: inherit; font-size: 15px; font-weight: 700; color: var(--sub-text); cursor: pointer; margin-bottom: -1px; }
        .pc .ct button.on { color: var(--primary); border-bottom-color: var(--primary); }
        .pc .ic { flex-shrink: 0; border: 0; background: none; color: var(--sub-text); padding: 6px; cursor: pointer; display: flex; }
        .pc .ic.on { color: var(--primary); }
        .pc .hs { display: flex; gap: 6px; overflow-x: auto; white-space: nowrap; scrollbar-width: none; margin-bottom: 6px; }
        .pc .hs button { flex-shrink: 0; border: 0; background: var(--tint); border-radius: 999px; padding: 5px 12px; font-size: 13px; font-weight: 600; color: var(--sub-text); cursor: pointer; }
        .pc .hs button.on { background: var(--primary); color: #fff; }
        .pc .foot { display: flex; gap: 12px; align-items: baseline; justify-content: center; margin-top: 18px; font-size: 12.5px; color: var(--sub-text); }
        .pc .foot b { color: var(--text); }
        .pc .lv { font-weight: 600; }
        .pc .lv.O, .pc .lb.O { color: var(--o); }
        .pc .lv.P, .pc .lb.P { color: var(--p); }
        .pc .lv.D, .pc .lb.D { color: var(--d); }
        .pc .st { font-size: 12px; color: var(--sub-text); white-space: nowrap; }
        .pc .st.error { color: #DC2626; }
        .pc .tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; }
        .pc .tools input { flex: 1 1 160px; min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; font: inherit; font-size: 14px; background: transparent; color: inherit; }
        .pc .flt { display: flex; gap: 4px; }
        .pc .flt button { border: 1px solid var(--line); background: transparent; border-radius: 999px; padding: 5px 11px; font-size: 13px; color: var(--sub-text); cursor: pointer; white-space: nowrap; }
        .pc .flt button.on { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pc .empty { padding: 30px 0; text-align: center; color: var(--sub-text); font-size: 14px; }
        .pc .grp { margin-top: 12px; }
        .pc .gh { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 2px 5px; border-bottom: 2px solid var(--primary); font-size: 14px; }
        .pc .gh span { font-size: 12.5px; color: var(--sub-text); }
        .pc .row { width: 100%; display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 8px 2px; background: none; border: 0; border-bottom: 1px solid var(--line); text-align: left; cursor: pointer; font: inherit; color: inherit; }
        .pc .row:active { background: var(--tint); }
        .pc .t { font-size: 14px; line-height: 1.35; }
        .pc .none { font-size: 12px; color: var(--sub-text); white-space: nowrap; flex-shrink: 0; }
        .pc .sm { font-size: 12px; color: var(--sub-text); text-align: right; flex-shrink: 0; max-width: 55%; line-height: 1.4; }
        .pc .lb { font-weight: 700; }
        .pc .ov { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.5); display: flex; align-items: flex-end; justify-content: center; }
        .pc .sheet { width: 100%; max-height: 88vh; overflow-y: auto; background: var(--white); border-radius: 16px 16px 0 0; padding: 16px 16px 24px; -webkit-overflow-scrolling: touch; }
        @media (min-width: 768px) { .pc .ov { align-items: center; } .pc .sheet { width: 520px; border-radius: 16px; } }
        .pc .sh { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .pc .sh h3 { margin: 0; font-size: 17px; font-weight: 800; line-height: 1.35; }
        .pc .cnt { font-size: 13px; color: var(--sub-text); }
        .pc .x { border: 0; background: none; font-size: 26px; line-height: 1; color: var(--sub-text); cursor: pointer; padding: 0 4px; }
        .pc .desc { margin: 10px 0 4px; font-size: 13px; line-height: 1.65; color: var(--sub-text); }
        .pc .blk { margin-top: 16px; }
        .pc .bt { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .pc .seg { display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
        .pc .seg button { flex: 1; border: 0; background: transparent; padding: 9px 0; font-size: 14px; cursor: pointer; color: var(--sub-text); }
        .pc .seg button + button { border-left: 1px solid var(--line); }
        .pc .seg button.on.O { background: var(--o); color: #fff; }
        .pc .seg button.on.P { background: var(--p); color: #fff; }
        .pc .seg button.on.D { background: var(--d); color: #fff; }
        .pc .frow { display: flex; gap: 6px; margin-top: 8px; }
        .pc .frow input, .pc .rmi { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; font: inherit; font-size: 14px; background: transparent; color: inherit; min-width: 0; }
        .pc .grow { flex: 1; }
        .pc .rmi { width: 100%; }
        .pc .add { width: 100%; margin-top: 8px; border: 0; background: var(--primary); color: #fff; border-radius: 8px; padding: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .pc .hr { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 14px; }
        .pc .hr.edit { display: block; }
        .pc .hd { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--text); cursor: pointer; min-width: 48px; text-align: left; }
        .pc .hd i { font-style: normal; font-size: 12px; font-weight: 500; color: var(--sub-text); }
        .pc .hm { flex-basis: 100%; order: 3; font-size: 13px; color: var(--sub-text); }
        .pc .acts { margin-left: auto; display: flex; gap: 4px; }
        .pc .hr.edit .acts { margin-top: 8px; justify-content: flex-end; }
        .pc .acts button { border: 1px solid var(--line); background: transparent; border-radius: 6px; padding: 4px 10px; font-size: 12.5px; color: var(--sub-text); cursor: pointer; }
        .pc .acts button.pri { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pc .acts button.dng { border-color: #DC2626; color: #DC2626; }
      `}</style>
    </div>
  );
}
