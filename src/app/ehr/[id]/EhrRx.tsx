'use client';

import { vnow } from '../vclock';
import { useState } from 'react';
import type { ChartData, Row } from '../types';

const FILTERS = ['전체', '미수행', '식이', 'PRN'] as const;
type F = (typeof FILTERS)[number];
const pad = (n: number) => String(n).padStart(2, '0');
const hm = () => { const d = vnow(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const isDiet = (r: Row) => /식$|식이|npo|금식|diet|죽|미음/i.test(r.name || '');

export default function RxPanel({ data, author, onChange }: { data: ChartData; author: string; onChange: (orders: Row[]) => void }) {
  const [f, setF] = useState<F>('미수행');
  const rows = data.orders.map((r, i) => ({ r, i })).filter(({ r }) => r.kind !== 'sec' && r.kind !== 'memo' && (r.name || '').trim());
  const live = (r: Row) => r.st !== '취소' && r.pri !== 'D/C';
  const shown = rows.filter(({ r }) => (f === '전체' ? true : f === '미수행' ? live(r) && !r.ck : f === 'PRN' ? r.pri === 'PRN' : isDiet(r)));
  const set = (i: number, patch: Row) => onChange(data.orders.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const pick = (i: number) => set(i, { st: '완료', ck: '1', t1: `${hm()}/${(author || '').slice(0, 1)}` });
  const cancel = (i: number) => set(i, { st: '취소', ck: '' });
  const undo = (i: number) => set(i, { st: '', ck: '' });
  return (
    <div className="rxp">
      <div className="rxf">
        {FILTERS.map(x => <button key={x} type="button" className={f === x ? 'on' : ''} onClick={() => setF(x)}>{x}</button>)}
      </div>
      {f === '식이' && data.dietord.length > 0 && (
        <div className="rxd">식이처방: {data.dietord.map(d => `${d.type || ''}${d.start ? ` (${d.start}~)` : ''}`).join(', ')}</div>
      )}
      {shown.length === 0 && <p className="rxn">해당하는 처방이 없어요.</p>}
      {shown.map(({ r, i }) => (
        <div key={i} className={`rxr ${live(r) ? '' : 'x'}`}>
          <div className="rxm">
            <b>{r.name}</b>
            <span>{[r.dose && `${r.dose}${r.unit || ''}`, r.route, r.cnt && `하루 ${r.cnt}회`, r.pri].filter(Boolean).join(' · ')}</span>
          </div>
          <span className="rxs">{r.st === '취소' ? '취소' : r.pri === 'D/C' ? 'D/C' : r.ck ? '실행' : '미수행'}</span>
          <div className="rxa">
            {live(r) && !r.ck && <button type="button" className="go" onClick={() => pick(i)}>실행</button>}
            {live(r) && r.ck && <button type="button" onClick={() => undo(i)}>실행 취소</button>}
            {live(r) && !r.ck && <button type="button" onClick={() => cancel(i)}>처방 취소</button>}
            {r.st === '취소' && <button type="button" onClick={() => undo(i)}>되돌리기</button>}
          </div>
        </div>
      ))}
      <style>{`
        .rxp{display:flex;flex-direction:column;gap:8px}
        .rxf{display:flex;gap:6px;flex-wrap:wrap}
        .rxf button{border:1px solid var(--border);background:transparent;color:inherit;border-radius:999px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer}
        .rxf button.on{border-color:var(--primary);color:var(--primary);font-weight:700}
        .rxn{color:var(--sub-text);font-size:13px;margin:4px 0}
        .rxd{font-size:13px;color:var(--sub-text)}
        .rxr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--border);border-radius:10px;padding:10px 12px}
        .rxr.x{opacity:.55}
        .rxm{flex:1;min-width:180px;display:flex;flex-direction:column;gap:2px}
        .rxm span{font-size:12.5px;color:var(--sub-text)}
        .rxs{font-size:12px;font-weight:700;color:var(--sub-text)}
        .rxa{display:flex;gap:6px}
        .rxa button{border:1px solid var(--border);background:transparent;color:inherit;border-radius:8px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer}
        .rxa .go{background:var(--primary);border-color:var(--primary);color:#fff;font-weight:700}
      `}</style>
    </div>
  );
}
