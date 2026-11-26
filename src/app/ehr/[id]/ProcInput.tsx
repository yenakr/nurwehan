'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { vnow } from '../vclock';
import type { ChartData, Row } from '../types';
import { MAT_INFO, matsFor } from '../codes';
import { ACT_MASTER, ACT_CATS } from '../master';

const p2 = (n: number) => String(n).padStart(2, '0');
const ymd = (t: Date) => `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`;

type L = { sel: boolean; act: string; code: string; name: string; spec: string; unit: string; qty: string };

// 처치/재료 입력 창: 왼쪽에서 처방 또는 행위를 고르면 오른쪽 표에 필요한 재료가 올라오고, 수량을 확인해 저장한다
export default function ProcInput({ data, setData, userName, onClose }: { data: ChartData; setData: Dispatch<SetStateAction<ChartData>>; userName: string; onClose: () => void }) {
  const i = data.info;
  const [date, setDate] = useState(() => ymd(vnow()));
  const [tab, setTab] = useState<'pre' | 'act'>('pre');
  const [cat, setCat] = useState(ACT_CATS[0] || '');
  const [rows, setRows] = useState<L[]>([]);
  const [place, setPlace] = useState(i.ward || '');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  // 전처방: 오늘 유효한 비투약 처방 중 재료가 따르는 것
  const pre = useMemo(() => {
    const out: { name: string; mats: [string, number][] }[] = [];
    data.orders.forEach(o => {
      if (o.kind === 'sec' || o.kind === 'memo' || !o.name || o.pri === 'D/C' || o.dose || o.route) return;
      const m = matsFor(o);
      if (m.length) out.push({ name: o.name, mats: m });
    });
    return out;
  }, [data.orders]);
  const acts = ACT_MASTER.filter(a => (q.trim() ? a.name.toLowerCase().includes(q.trim().toLowerCase()) : a.cat === cat));

  const add = (act: string, mats: [string, number][]) => {
    setMsg('');
    setRows(r => [...r, ...mats.map(([name, qty]): L => {
      const mi = MAT_INFO.get(name);
      return { sel: false, act, code: mi?.code || '', name, spec: mi?.spec || '', unit: mi?.unit || 'ea', qty: String(qty) };
    })]);
  };
  const save = () => {
    const use = rows.filter(r => Number(r.qty) > 0);
    if (!use.length) { setMsg('저장할 재료가 없습니다'); return; }
    const time = `${date.slice(5)} ${p2(vnow().getHours())}:${p2(vnow().getMinutes())}`;
    const acted = Array.from(new Set<string>(use.map(r => r.act)));
    setData(d => ({
      ...d,
      mat: [...d.mat, ...use.map((r): Row => ({ time, item: r.name, qty: r.qty, unit: r.unit, act: r.act, by: userName }))],
      nact: [...d.nact, ...acted.map((a): Row => ({ time, act: a, mat: '', by: userName, st: '수행', note: '' }))],
    }));
    setRows([]);
    setMsg(`${use.length}건 저장했습니다`);
  };

  return (
    <div className="pi">
      <style>{`
        .pi { display: flex; flex-direction: column; height: 100%; min-height: 0; font-size: 12.5px; }
        .pi-q { display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border); background: #f6f8fb; }
        .pi-q label { display: inline-flex; gap: 6px; align-items: center; font-weight: 700; }
        .pi-q input { padding: 3px 6px; font-size: 12.5px; border: 1px solid var(--border); border-radius: 4px; }
        .pi-m { flex: 1; min-height: 0; display: grid; grid-template-columns: 300px minmax(0, 1fr); }
        .pi-l { border-right: 1px solid var(--border); display: flex; flex-direction: column; min-height: 0; }
        .pi-tb { display: flex; gap: 2px; padding: 6px 8px 0; border-bottom: 1px solid var(--border); }
        .pi-tb button { border: 1px solid var(--border); border-bottom: 0; border-radius: 4px 4px 0 0; background: #eef2f7; padding: 4px 12px; font: inherit; font-weight: 700; cursor: pointer; }
        .pi-tb button.on { background: #fff; color: var(--primary); }
        .pi-ls { overflow: auto; flex: 1; }
        .pi-ls button { display: block; width: 100%; text-align: left; padding: 5px 10px; border: 0; border-bottom: 1px solid #edf0f5; background: #fff; font: inherit; cursor: pointer; }
        .pi-ls button:hover { background: #eaf2fb; }
        .pi-ls small { display: block; color: var(--sub-text); font-size: 11px; }
        .pi-ft { display: flex; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--border); }
        .pi-ft select, .pi-ft input { flex: 1; min-width: 0; padding: 3px 6px; font-size: 12.5px; border: 1px solid var(--border); border-radius: 4px; }
        .pi-r { overflow: auto; min-height: 0; }
        .pi-r table { min-width: 0 !important; width: 100%; border-collapse: collapse; }
        .pi-r th { position: sticky; top: 0; background: #eaf0f7; border: 1px solid var(--border); padding: 4px 6px; white-space: nowrap; }
        .pi-r td { border: 1px solid #e3e8ef; padding: 3px 6px; }
        .pi-r input[type='number'] { width: 56px; padding: 2px 4px; font-size: 12.5px; text-align: center; }
        .pi-b { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-top: 1px solid var(--border); background: #f6f8fb; }
        .pi-b label { font-weight: 700; display: inline-flex; gap: 6px; align-items: center; margin-left: auto; }
        .pi-b input { padding: 3px 6px; font-size: 12.5px; border: 1px solid var(--border); border-radius: 4px; width: 120px; }
        .pi-b button { border: 1px solid var(--border); background: #fff; border-radius: 4px; padding: 4px 12px; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .pi-b button.p { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pi-b button:disabled { opacity: .45; cursor: default; }
        .pi-msg { color: #b45309; font-weight: 700; }
        .pi-none { padding: 16px; color: var(--sub-text); }
      `}</style>
      <div className="pi-q">
        <label>환자명 <input value={i.name || ''} readOnly style={{ width: 90 }} /></label>
        <label>입원일자 <input value={(i.admit || '').replace(/-/g, '').slice(0, 8)} readOnly style={{ width: 90 }} /></label>
        <label>처방일 <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      </div>
      <div className="pi-m">
        <div className="pi-l">
          <div className="pi-tb">
            <button type="button" className={tab === 'pre' ? 'on' : ''} onClick={() => setTab('pre')}>전처방</button>
            <button type="button" className={tab === 'act' ? 'on' : ''} onClick={() => setTab('act')}>행위/상황별</button>
          </div>
          {tab === 'act' && (
            <div className="pi-ft">
              <select value={cat} onChange={e => { setCat(e.target.value); setQ(''); }} aria-label="분류">{ACT_CATS.map(c => <option key={c}>{c}</option>)}</select>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="검색" aria-label="행위 검색" />
            </div>
          )}
          <div className="pi-ls">
            {tab === 'pre'
              ? (pre.length ? pre.map(p => <button key={p.name} type="button" onClick={() => add(p.name, p.mats)}>{p.name}<small>{p.mats.map(m => m[0]).join(', ')}</small></button>) : <p className="pi-none">No data to display</p>)
              : (acts.length ? acts.map(a => <button key={a.code} type="button" onClick={() => add(a.name, a.mats)}>{a.name}<small>{a.code}</small></button>) : <p className="pi-none">No data to display</p>)}
          </div>
        </div>
        <div className="pi-r">
          <table>
            <thead><tr><th><input type="checkbox" aria-label="전체 선택" checked={rows.length > 0 && rows.every(r => r.sel)} onChange={e => setRows(r => r.map(x => ({ ...x, sel: e.target.checked })))} /></th><th>상태</th><th>처치/불출장소</th><th>코드</th><th>처치/재료명</th><th>규격</th><th>단위</th><th>실시횟수</th></tr></thead>
            <tbody>
              {rows.map((r, k) => (
                <tr key={k}>
                  <td><input type="checkbox" aria-label="선택" checked={r.sel} onChange={e => setRows(rs => rs.map((x, j) => (j === k ? { ...x, sel: e.target.checked } : x)))} /></td>
                  <td>U</td><td>{place}</td><td>{r.code}</td><td>{r.name}<small style={{ display: 'block', color: 'var(--sub-text)' }}>{r.act}</small></td><td>{r.spec}</td><td>{r.unit}</td>
                  <td><input type="number" min={0} value={r.qty} onChange={e => setRows(rs => rs.map((x, j) => (j === k ? { ...x, qty: e.target.value } : x)))} aria-label="실시횟수" /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="pi-none">No data to display</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pi-b">
        {msg && <span className="pi-msg">{msg}</span>}
        <label>처치/불출장소 <input value={place} onChange={e => setPlace(e.target.value)} /></label>
        <button type="button" className="p" onClick={save} disabled={rows.length === 0}>처방내림</button>
        <button type="button" onClick={() => setRows(r => r.filter(x => !x.sel))} disabled={!rows.some(r => r.sel)}>삭제</button>
        <button type="button" onClick={onClose}>종료 (Esc)</button>
      </div>
    </div>
  );
}
