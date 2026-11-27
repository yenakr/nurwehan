'use client';

import { vnow } from '../vclock';
import { useMemo, useState } from 'react';
import type { ChartData, Row } from '../types';
import { PHRASES } from '../phrases';

// 실제 EMR 스타일 간호기록: 일시 · 구분(Focus) · 내용(여러 줄) · 작성자. 야간/특이는 빨간 글씨.
const CSS = `
  .nr { display: flex; flex-direction: column; height: 100%; font-size: 13px; }
  .nr-bar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid var(--border); background: #f3f6fa; }
  .nr-bar button, .nr-bar input, .nr-bar select { padding: 3px 9px !important; font-size: 12.5px; border: 1px solid var(--border); border-radius: 4px; background: #fff; width: auto; }
  .nr-bar button.on { background: var(--primary); color: #fff; border-color: var(--primary); }
  .nr-bar .sp { flex: 1; }
  .nr-tb { flex: 1; overflow: auto; min-height: 160px; }
  .nr table { width: 100%; min-width: 0 !important; border-collapse: collapse; table-layout: fixed; }
  .nr th { position: sticky; top: 0; background: #dfe7f1; padding: 5px 8px; border: 1px solid var(--border); text-align: left; font-size: 12.5px; z-index: 1; }
  .nr td { padding: 5px 8px; border: 1px solid var(--border); vertical-align: top; }
  .nr td.c { white-space: pre-wrap; line-height: 1.5; word-break: break-all; }
  .nr tr.red td { color: #c0152a; }
  .nr tr.red td:nth-child(2) { font-weight: 700; }
  .nr tr.day td:first-child { background: #eef3f9; font-weight: 700; }
  .nr .none { text-align: center; color: var(--sub-text); padding: 24px; }
  .nr-w { border-top: 2px solid var(--primary); padding: 8px 12px; background: #fafcff; }
  .nr-w .r1 { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 6px; }
  .nr-w input { padding: 4px 8px !important; font-size: 13px; border: 1px solid var(--border); border-radius: 4px; width: auto; }
  .nr-w textarea { width: 100%; min-height: 96px; padding: 8px !important; font-size: 13px; line-height: 1.5; border: 1px solid var(--border); border-radius: 4px; box-sizing: border-box; }
  .nr-w .chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0; }
  .nr-w .chips button { font-size: 12px; padding: 1px 8px; border: 1px solid var(--border); border-radius: 999px; background: #fff; cursor: pointer; }
  .nr-w .chips button.k { background: #eaf0f7; font-weight: 700; }
  .nr-w .btns { display: flex; gap: 6px; justify-content: flex-end; margin-top: 6px; }
  .nr-w .btns button { padding: 5px 14px; border-radius: 4px; border: 1px solid var(--border); background: #fff; cursor: pointer; }
  .nr-w .btns button.p { background: var(--primary); color: #fff; border-color: var(--primary); }
  .nr-err { color: #c0152a; font-size: 12px; }
`;
const p2 = (n: number) => String(n).padStart(2, '0');
const stamp = () => { const t = vnow(); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())} ${p2(t.getHours())}:${p2(t.getMinutes())}`; };
const full = (s: string) => (/^\d{2}-\d{2} /.test(s) ? `${vnow().getFullYear()}-${s}` : s);
const hourOf = (s: string) => Number((s.split(' ')[1] || '').slice(0, 2));
const SPECIAL = /(낙상|출혈|notify|Notify|보고|보류|호흡곤란|발열|응급|rapid|CPR|억제|욕창|투약 보류|통증)/;
const isRed = (r: Row) => { const h = hourOf(full(r.time || '')); return r.shift === 'N' || h >= 22 || (h >= 0 && h < 6) || SPECIAL.test(`${r.focus || ''} ${r.text || ''}`.slice(0, 120)); };
const dutyOf = () => { const h = vnow().getHours(); return h >= 6 && h < 14 ? 'D' : h >= 14 && h < 22 ? 'E' : 'N'; };

export default function NursingRecord({ data, setData, userName, duty, today }: {
  data: ChartData; setData: (f: (d: ChartData) => ChartData) => void; userName: string; duty: string; today: string;
}) {
  const [sh, setSh] = useState<'all' | 'D' | 'E' | 'N'>('all');
  const [q, setQ] = useState('');
  const [pf, setPf] = useState('');
  const [pt, setPt] = useState('');
  const [time, setTime] = useState(stamp);
  const [focus, setFocus] = useState('');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const ph = PHRASES.find(p => p.focus === focus);

  const rows = useMemo(() => data.notes
    .map((r, i) => ({ r, i, t: full(r.time || '') }))
    .filter(x => (sh === 'all' || (sh === 'D' ? hourOf(x.t) >= 6 && hourOf(x.t) < 14 : sh === 'E' ? hourOf(x.t) >= 14 && hourOf(x.t) < 22 : hourOf(x.t) >= 22 || hourOf(x.t) < 6)) && (!q.trim() || `${x.r.focus} ${x.r.text} ${x.r.author}`.includes(q.trim())))
    .filter(x => (!pf || x.t.slice(0, 10) >= pf) && (!pt || x.t.slice(0, 10) <= pt))
    .sort((a, b) => b.t.localeCompare(a.t)), [data.notes, sh, q, pf, pt]);

  const put = (s: string, k: 'D' | 'A' | 'R') => setText(t => {
    const head = `${k})\n`;
    if (!t.includes(head)) return `${t}${t && !t.endsWith('\n') ? '\n\n' : ''}${head}${s}`;
    const [pre, post] = [t.slice(0, t.indexOf(head) + head.length), t.slice(t.indexOf(head) + head.length)];
    const m = post.search(/\n\n[DAR]\)\n/);
    return m < 0 ? `${pre}${post}\n${s}` : `${pre}${post.slice(0, m)}\n${s}${post.slice(m)}`;
  });

  // 오늘 수행한 처방/활력징후로 D) 초안 자동 작성
  const draft = () => {
    const lines: string[] = [];
    data.orders.forEach(o => {
      const ts = Object.keys(o).filter(k => /^t\d+$/.test(k) && o[k]).map(k => o[k].split(' ')[0]);
      if (ts.length && o.name) lines.push(`${ts.join(', ')} ${o.name}${o.dose ? ` ${o.dose}${o.unit || ''}` : ''}${o.route ? ` ${o.route}` : ''} ${o.dose ? '투약함' : '수행함'}`);
    });
    const v = [...data.vitals].filter(x => x.time).pop();
    if (v) lines.push(`V/S ${v.time} BP ${v.sbp || '-'}/${v.dbp || '-'}mmHg, HR ${v.hr || '-'}, RR ${v.rr || '-'}, BT ${v.bt || '-'}℃, SpO2 ${v.spo2 || '-'}%${v.pain ? `, 통증 NRS ${v.pain}` : ''}`);
    if (!lines.length) { setErr('오늘 수행 내역이 없어요'); return; }
    setErr(''); setFocus(f => f || '수행 내역'); setText(t => `${t ? `${t}\n\n` : ''}D)\n${lines.join('\n')}`);
  };

  const save = () => {
    if (!text.trim()) { setErr('내용을 입력하세요'); return; }
    if (!focus.trim()) { setErr('구분(Focus)을 입력하세요'); return; }
    if (!/^(\d{4}-)?\d{2}-\d{2} \d{2}:\d{2}$/.test(time.trim())) { setErr('일시 형식: 2026-11-25 14:30'); return; }
    const row: Row = { time: full(time.trim()), focus: focus.trim(), text: text.trim(), author: userName, shift: dutyOf() || duty };
    setData(d => ({ ...d, notes: [...d.notes, row] }));
    setText(''); setFocus(''); setTime(stamp()); setErr('');
  };
  const del = (i: number) => { if (data.notes[i]?.author !== userName) return; setData(d => ({ ...d, notes: d.notes.filter((_, k) => k !== i) })); };

  let lastDay = '';
  return (
    <div className="nr">
      <style>{CSS}</style>
      <div className="nr-bar">
        {(['all', 'D', 'E', 'N'] as const).map(k => <button key={k} type="button" className={sh === k ? 'on' : ''} onClick={() => setSh(k)}>{k === 'all' ? '전체' : k}</button>)}
        <input placeholder="구분·내용·작성자 검색" value={q} onChange={e => setQ(e.target.value)} />
        <b>조회기간</b>
        <input type="date" value={pf} onChange={e => setPf(e.target.value)} aria-label="조회 시작일" style={{ flex: '0 0 auto', width: 140 }} />~
        <input type="date" value={pt} onChange={e => setPt(e.target.value)} aria-label="조회 종료일" style={{ flex: '0 0 auto', width: 140 }} />
        <span className="sp" />
        <span style={{ color: 'var(--sub-text)' }}>{rows.length}건 · 빨간 글씨 = 야간/특이</span>
      </div>
      <div className="nr-tb">
        <table>
          <colgroup><col style={{ width: 118 }} /><col style={{ width: 110 }} /><col /><col style={{ width: 82 }} /></colgroup>
          <thead><tr><th>일시</th><th>구분</th><th>내용</th><th>작성자</th></tr></thead>
          <tbody>
            {rows.flatMap(({ r, i, t }) => {
              const day = t.slice(0, 10); const out = [];
              if (day !== lastDay) { lastDay = day; out.push(<tr key={`d${day}`} className="day"><td colSpan={4}>{day}{day === today ? ' (오늘)' : ''}</td></tr>); }
              out.push(<tr key={i} className={isRed(r) ? 'red' : ''} onDoubleClick={() => del(i)} title={r.author === userName ? '더블클릭: 삭제' : ''}><td>{t.slice(5)}</td><td>{r.focus}</td><td className="c">{r.text}</td><td>{r.author}{r.shift ? ` (${r.shift})` : ''}</td></tr>);
              return out;
            })}
            {rows.length === 0 && <tr><td colSpan={4} className="none">No data to display</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="nr-w">
        <div className="r1">
          <b>기록 작성</b>
          <input style={{ width: 150 }} value={time} onChange={e => setTime(e.target.value)} aria-label="일시" />
          <input style={{ width: 150 }} list="nr-focus" placeholder="구분(Focus)" value={focus} onChange={e => setFocus(e.target.value)} />
          <datalist id="nr-focus">{PHRASES.map(p => <option key={p.focus} value={p.focus} />)}</datalist>
          <button type="button" onClick={draft} style={{ padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>수행내용 불러오기</button>
          {err && <span className="nr-err">{err}</span>}
        </div>
        {ph && (
          <div className="chips">
            {(['d', 'a', 'r'] as const).flatMap(k => [<button key={`h${k}`} type="button" className="k" disabled>{k.toUpperCase()}</button>, ...ph[k].map(s => <button key={`${k}${s}`} type="button" onClick={() => put(s, k.toUpperCase() as 'D' | 'A' | 'R')}>{s}</button>)])}
          </div>
        )}
        <textarea placeholder={'D)\nA)\nR)'} value={text} onChange={e => setText(e.target.value)} />
        <div className="btns"><button type="button" onClick={() => { setText(''); setFocus(''); setErr(''); }}>초기화</button><button type="button" className="p" onClick={save}>저장</button></div>
      </div>
    </div>
  );
}
