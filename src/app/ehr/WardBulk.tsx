'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/components/Dialog';
import type { ChartData, Row } from './types';

export type BulkPt = { key: string; bed: string; name: string; ageSex: string; id?: string; make: () => { title: string; subject: string | null; data: unknown } };

const COLS: { key: string; label: string; ph: string }[] = [
  { key: 'bp', label: '혈압', ph: '120/80' },
  { key: 'hr', label: '맥박', ph: '72' },
  { key: 'rr', label: '호흡', ph: '18' },
  { key: 'bt', label: '체온', ph: '36.5' },
  { key: 'spo2', label: 'SpO₂', ph: '98' },
  { key: 'pain', label: '통증', ph: '0' },
];
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

export default function WardBulk({ pts, onClose }: { pts: BulkPt[]; onClose: () => void }) {
  const router = useRouter();
  const [time, setTime] = useState(nowHM);
  const [vals, setVals] = useState<Record<string, Row>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string, f: string, v: string) => setVals(s => ({ ...s, [k]: { ...(s[k] || {}), [f]: v } }));
  const has = (k: string) => COLS.some(c => vals[k]?.[c.key]);

  const apply = async () => {
    const todo = pts.filter(p => has(p.key));
    if (todo.length === 0) return;
    setBusy(true);
    try {
      const saved = todo.filter(p => p.id).map(p => ({ id: p.id as string, row: { time, ...vals[p.key] } }));
      let n = 0;
      if (saved.length) {
        const r = await fetch('/api/ehr/bulk-vitals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: saved }) });
        const j = await r.json().catch(() => ({}));
        n += r.ok ? Number(j.n) || 0 : 0;
      }
      for (const p of todo.filter(p => !p.id)) {
        const m = p.make();
        const d = m.data as ChartData;
        const r = await fetch('/api/ehr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, data: { ...d, vitals: [...(d.vitals || []), { time, ...vals[p.key] }] } }) });
        if (r.ok) n++;
      }
      notify(`${n}명 입력했어요.`);
      router.refresh();
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <div className="wbk">
      <style>{`
        .wbk { background: var(--background, #fff); color: inherit; border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
        .wbk .sc { overflow-x: auto; }
        .wbk table { border-collapse: collapse; width: 100%; font-size: 13px; }
        .wbk th { text-align: left; padding: 4px 6px; color: var(--sub-text); font-weight: 600; white-space: nowrap; }
        .wbk td { padding: 2px 3px; white-space: nowrap; }
        .wbk td.pt { padding-right: 8px; }
        .wbk input { width: 100%; min-width: 62px; box-sizing: border-box; border: 1px solid var(--border); border-radius: 6px; padding: 7px 8px; font: inherit; background: transparent; color: inherit; }
        .wbk .bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .wbk .bar button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 999px; padding: 6px 14px; font: inherit; font-size: 12.5px; cursor: pointer; }
        .wbk .bar .ok { margin-left: auto; background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .wbk .bar input { width: 84px; }
      `}</style>
      <div className="bar">
        <b style={{ fontSize: 14 }}>활력징후 일괄 입력</b>
        <input value={time} onChange={e => setTime(e.target.value)} aria-label="측정 시간" />
        <button type="button" onClick={() => setVals({})}>비우기</button>
      </div>
      <div className="sc">
        <table>
          <thead><tr><th>병상</th><th>환자</th>{COLS.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {pts.map(p => (
              <tr key={p.key}>
                <td className="pt"><b>{p.bed}</b></td>
                <td className="pt">{p.name} {p.ageSex}</td>
                {COLS.map(c => <td key={c.key}><input value={vals[p.key]?.[c.key] || ''} inputMode={c.key === 'bp' ? 'text' : 'decimal'} onChange={e => set(p.key, c.key, e.target.value)} aria-label={`${p.bed} ${c.label}`} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bar">
        <button type="button" onClick={onClose}>닫기</button>
        <button type="button" className="ok" disabled={busy} onClick={apply}>{busy ? '입력 중' : '입력'}</button>
      </div>
    </div>
  );
}
