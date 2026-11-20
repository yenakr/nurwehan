'use client';

import { useState } from 'react';
import type { Row } from '../types';

export const MEMO_TYPES = ['간호메모', '진료메모', '인수인계'] as const;

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = () => { const d = new Date(); return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export default function MemoPanel({ rows, author, onChange }: { rows: Row[]; author: string; onChange: (rows: Row[]) => void }) {
  const [type, setType] = useState<string>(MEMO_TYPES[0]);
  const [text, setText] = useState('');
  const [imp, setImp] = useState(false);
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange([{ time: stamp(), type, text: t, author, ...(imp ? { imp: '1' } : {}) }, ...rows]);
    setText('');
    setImp(false);
  };
  return (
    <div className="mp">
      <style>{`
        .mp { display: flex; flex-direction: column; gap: 10px; }
        .mp .cmp { border: 1px solid var(--border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .mp .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .mp .chips button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 999px; padding: 6px 14px; font: inherit; font-size: 13px; cursor: pointer; }
        .mp .chips button.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .mp textarea { width: 100%; box-sizing: border-box; min-height: 84px; border: 1px solid var(--border); border-radius: 8px; padding: 9px; font: inherit; background: transparent; color: inherit; resize: vertical; }
        .mp .act { display: flex; align-items: center; gap: 10px; }
        .mp .act label { font-size: 13px; display: flex; align-items: center; gap: 4px; }
        .mp .act .go { margin-left: auto; border: 0; background: var(--primary); color: #fff; border-radius: 999px; padding: 8px 20px; font: inherit; font-weight: 700; cursor: pointer; }
        .mp .it { border: 1px solid var(--border); border-left-width: 4px; border-radius: 8px; padding: 9px 11px; font-size: 13.5px; line-height: 1.6; }
        .mp .it.t1 { border-left-color: #2563eb; }
        .mp .it.t2 { border-left-color: #059669; }
        .mp .it.t3 { border-left-color: #d97706; }
        .mp .it.im { background: rgba(220, 38, 38, 0.07); }
        .mp .it .h { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--sub-text); }
        .mp .it .h b { color: inherit; }
        .mp .it .h .x { margin-left: auto; border: 0; background: transparent; color: inherit; font-size: 18px; line-height: 1; cursor: pointer; }
        .mp .it p { margin: 2px 0 0; white-space: pre-wrap; }
      `}</style>
      <div className="cmp">
        <div className="chips">{MEMO_TYPES.map(t => <button key={t} type="button" className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>)}</div>
        <textarea value={text} onChange={e => setText(e.target.value)} aria-label="메모 내용" />
        <div className="act">
          <label><input type="checkbox" checked={imp} onChange={e => setImp(e.target.checked)} />중요</label>
          <button type="button" className="go" onClick={add}>기록</button>
        </div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`it t${MEMO_TYPES.indexOf(r.type as (typeof MEMO_TYPES)[number]) + 1} ${r.imp ? 'im' : ''}`}>
          <div className="h"><b>{r.type}</b><span>{r.time}</span><span>{r.author}</span>{r.imp ? <b style={{ color: '#dc2626' }}>중요</b> : null}
            <button type="button" className="x" aria-label="삭제" onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button></div>
          <p>{r.text}</p>
        </div>
      ))}
    </div>
  );
}
