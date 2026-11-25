'use client';

import { useMemo, useState } from 'react';
import type { ChartData, Row } from '../types';

// 처방 비교: 두 날짜(기준일 · 비교일)를 좌우로 놓고 신규/중지/변경/유지를 색으로 구분한다.
type Ver = { name: string; dose: string; unit: string; cnt: string; route: string; pri: string; sd: string; ed: string };
type Kind = '신규' | '중지' | '변경' | '유지';
const FIELDS: [keyof Ver, string][] = [['dose', '용량'], ['unit', '단위'], ['cnt', '횟수'], ['route', '경로'], ['pri', '구분']];
const ymd = (t: Date) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
const addD = (s: string, n: number) => { const t = new Date(`${s}T00:00:00`); t.setDate(t.getDate() + n); return ymd(t); };

export default function OrderCompare({ data, today, onClose }: { data: ChartData; today: string; onClose: () => void }) {
  const admit = (data.info.admit || '').slice(0, 10);
  const [a, setA] = useState(addD(today, -1));
  const [b, setB] = useState(today);
  const [onlyChg, setOnlyChg] = useState(false);

  const vers: Ver[] = useMemo(() => {
    const cur = data.orders.filter(r => r.kind !== 'sec' && r.kind !== 'memo' && r.name).map((r): Ver => ({
      name: r.name || '', dose: r.dose || '', unit: r.unit || '', cnt: r.cnt || '', route: r.route || '', pri: r.pri === 'D/C' ? '' : r.pri || '',
      sd: r.sd || (r.st === '추가' ? today : admit || addD(today, -30)),
      ed: r.ed || (r.pri === 'D/C' ? today : ''),
    }));
    const past = data.memos.filter(m => m.type === 'ordhist').map((m: Row): Ver => ({ name: m.name || '', dose: m.dose || '', unit: m.unit || '', cnt: m.cnt || '', route: m.route || '', pri: m.pri || '', sd: m.sd || admit || addD(today, -30), ed: m.ed || '' }));
    return [...cur, ...past];
  }, [data.orders, data.memos, admit, today]);

  const activeOn = (d: string) => {
    const m = new Map<string, Ver>();
    vers.filter(v => v.sd <= d && (!v.ed || d < v.ed)).forEach(v => m.set(v.name, v));
    return m;
  };
  const rows = useMemo(() => {
    const A = activeOn(a), B = activeOn(b);
    const keys = [...new Set([...A.keys(), ...B.keys()])];
    const order = new Map<string, number>(data.orders.map((r, i): [string, number] => [r.name || '', i]));
    keys.sort((x, y) => (order.get(x) ?? 999) - (order.get(y) ?? 999));
    return keys.map(k => {
      const l = A.get(k), r = B.get(k);
      const kind: Kind = l && !r ? '중지' : !l && r ? '신규' : FIELDS.some(([f]) => l![f] !== r![f]) ? '변경' : '유지';
      return { k, l, r, kind };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vers, a, b, data.orders]);
  const cnt = (k: Kind) => rows.filter(x => x.kind === k).length;
  const shown = rows.filter(x => !onlyChg || x.kind !== '유지');
  const cell = (v: Ver | undefined, other: Ver | undefined) => (
    <>
      <td className="nm">{v ? v.name : ''}</td>
      {FIELDS.slice(0, 4).map(([f]) => <td key={f} className={v && other && v[f] !== other[f] ? 'df' : ''}>{v ? v[f] : ''}</td>)}
    </>
  );

  return (
    <div className="ns-nmd" role="dialog" aria-label="처방 비교">
      <button type="button" className="ns-nmk" aria-label="닫기" onClick={onClose} />
      <div className="ns-nmb oc">
        <style>{`
          .ns-nmb.oc { width: min(1100px, 100%); }
          .oc .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
          .oc .bar input[type=date] { padding: 4px 6px; font: inherit; }
          .oc .bar button { border: 1px solid var(--border); background: #f6f8fb; border-radius: 4px; padding: 3px 10px; font: inherit; cursor: pointer; }
          .oc .lg { display: flex; gap: 6px; margin-left: auto; }
          .oc .lg span { padding: 1px 8px; border-radius: 999px; font-weight: 700; font-size: 12px; }
          .oc .sc { max-height: 62vh; overflow: auto; padding: 0 16px 12px; }
          .oc table { width: 100%; min-width: 0 !important; border-collapse: collapse; font-size: 13px; }
          .oc th { position: sticky; top: 0; background: #eaf0f7; padding: 5px 8px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; z-index: 1; }
          .oc th.side { text-align: center; background: #dfe6ee; }
          .oc td { padding: 4px 8px; border-bottom: 1px solid #eef1f5; }
          .oc td.nm { min-width: 220px; }
          .oc td.mid { width: 64px; text-align: center; padding: 0; }
          .oc td.mid b { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11.5px; }
          .oc tr.k신규 td { background: rgba(16,185,129,.13); } .oc tr.k신규 b { background: #10b981; color: #fff; }
          .oc tr.k중지 td { background: rgba(239,68,68,.12); } .oc tr.k중지 b { background: #ef4444; color: #fff; }
          .oc tr.k변경 td { background: rgba(245,158,11,.14); } .oc tr.k변경 b { background: #f59e0b; color: #fff; }
          .oc tr.k유지 td { color: var(--sub-text); } .oc tr.k유지 b { background: #e5e7eb; color: #64748b; }
          .oc td.df { font-weight: 800; color: #b45309; text-decoration: underline; }
          .oc td.l { border-left: 2px solid #94a3b8; }
          .oc .none { text-align: center; color: var(--sub-text); padding: 20px; }
          .oc .s1 { background: rgba(16,185,129,.2); color: #047857; } .oc .s2 { background: rgba(239,68,68,.18); color: #b91c1c; } .oc .s3 { background: rgba(245,158,11,.22); color: #92400e; } .oc .s4 { background: #eef1f5; color: #64748b; }
        `}</style>
        <header><b>처방 비교</b><button type="button" onClick={onClose}>닫기</button></header>
        <div className="bar">
          <label>기준일 <input type="date" value={a} onChange={e => setA(e.target.value)} /></label>
          <button type="button" title="좌우 날짜 바꾸기" onClick={() => { setA(b); setB(a); }}>⇄</button>
          <label>비교일 <input type="date" value={b} onChange={e => setB(e.target.value)} /></label>
          <button type="button" onClick={() => { setA(addD(today, -1)); setB(today); }}>전일 ↔ 오늘</button>
          {admit && <button type="button" onClick={() => { setA(admit); setB(today); }}>입원일 ↔ 오늘</button>}
          <label><input type="checkbox" checked={onlyChg} onChange={e => setOnlyChg(e.target.checked)} /> 변경사항만</label>
          <div className="lg"><span className="s1">신규 {cnt('신규')}</span><span className="s2">중지 {cnt('중지')}</span><span className="s3">변경 {cnt('변경')}</span><span className="s4">유지 {cnt('유지')}</span></div>
        </div>
        <div className="sc">
          <table>
            <thead>
              <tr><th colSpan={5} className="side">{a} (기준일)</th><th /><th colSpan={5} className="side">{b} (비교일)</th></tr>
              <tr><th>처방명</th><th>용량</th><th>단위</th><th>횟수</th><th>경로</th><th>구분</th><th>처방명</th><th>용량</th><th>단위</th><th>횟수</th><th>경로</th></tr>
            </thead>
            <tbody>
              {shown.map(x => (
                <tr key={x.k} className={`k${x.kind}`}>
                  {cell(x.l, x.r)}
                  <td className="mid"><b>{x.kind}</b></td>
                  {cell(x.r, x.l)}
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={11} className="none">{rows.length ? '변경된 처방이 없어요' : '해당 날짜에 유효한 처방이 없어요'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
