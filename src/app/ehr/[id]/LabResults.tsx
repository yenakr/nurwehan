'use client';

import { vnow } from '../vclock';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { ChartData, Row } from '../types';

// 검사결과조회: 검사진행 / 검사결과(수치) / 시계열 조회
type Props = { data: ChartData; setData: Dispatch<SetStateAction<ChartData>>; userName: string };

const md = (t?: string) => /(\d{2}-\d{2})\s\d{2}:\d{2}/.exec(t || '')?.[1] || '';
const hmOf = (t?: string) => /(\d{2}:\d{2})\s*$/.exec(t || '')?.[1] || '';
const addMin = (hm: string, n: number) => { const [h, m] = hm.split(':').map(Number); const x = (((h * 60 + m + n) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const flagOf = (r: Row) => {
  const v = parseFloat(r.value || ''), lo = parseFloat(r.min || ''), hi = parseFloat(r.max || '');
  if (Number.isNaN(v)) return '';
  if (!Number.isNaN(hi) && v > hi) return 'H';
  if (!Number.isNaN(lo) && v < lo) return 'L';
  return '';
};
const code = (name: string) => `L${String([...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9000, 7) + 1000)}`;
const READERS = ['박정원', '김서윤', '이도현'];
const reader = (name: string) => READERS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % READERS.length];
const mark = (f: string) => (f === 'H' ? '▲' : f === 'L' ? '▼' : '');

export default function LabResults({ data, setData, userName }: Props) {
  const [tab, setTab] = useState<'prog' | 'num' | 'ts'>('num');
  const [abn, setAbn] = useState(false);
  const [sel, setSel] = useState('');
  const hist = data.memos.filter(m => m.type === 'labhist');
  const done = data.labs.filter(r => r.value);
  const pending = data.labs.filter(r => !r.value);
  const dates = useMemo(() => {
    const s = new Set<string>();
    [...done, ...hist].forEach(r => { const d = md(r.time); if (d) s.add(d); });
    return [...s].sort();
  }, [done, hist]);
  const cur = sel && dates.includes(sel) ? sel : dates[dates.length - 1] || '';
  const rows = done.filter(r => md(r.time) === cur && (!abn || flagOf(r)));
  const unack = done.filter(r => flagOf(r) && !r.ack).length;
  const ack = (r: Row) => setData(d => ({ ...d, labs: d.labs.map(x => (x === r ? { ...x, ack: `${vnow().toTimeString().slice(0, 5)} ${userName}` } : x)) }));
  const names = [...new Set([...done, ...hist].map(r => r.name || ''))].filter(Boolean);
  const tsAt = (name: string, d: string): Row | undefined => [...done, ...hist].filter(r => r.name === name && md(r.time) === d).slice(-1)[0];

  return (
    <div className="lr">
      <style>{`
        .lr { padding: 8px 10px; font-size: 13px; }
        .lr .tb { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
        .lr .tb button { border: 1px solid var(--border); border-bottom: 0; background: #f6f8fb; padding: 6px 14px; font: inherit; font-weight: 600; cursor: pointer; border-radius: 6px 6px 0 0; }
        .lr .tb button.on { background: #fff; color: var(--primary); }
        .lr .op { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
        .lr .op label { display: inline-flex; align-items: center; gap: 4px; }
        .lr .sc { overflow: auto; max-height: 62vh; border: 1px solid var(--border); }
        .lr table { min-width: 0 !important; width: 100%; border-collapse: collapse; }
        .lr th { position: sticky; top: 0; background: #eaf0f7; z-index: 1; text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--border); white-space: nowrap; font-size: 12.5px; }
        .lr td { padding: 3px 8px; border-bottom: 1px solid #eef1f5; white-space: nowrap; font-size: 12.5px; }
        .lr td.n { font-variant-numeric: tabular-nums; }
        .lr .H { color: #dc2626; font-weight: 700; }
        .lr .L { color: #2563eb; font-weight: 700; }
        .lr tr.un td { background: #fff5f5; }
        .lr .ab { border: 1px solid #dc2626; background: #fff; color: #dc2626; border-radius: 4px; font: inherit; font-size: 12px; padding: 1px 8px; cursor: pointer; }
        .lr .st { display: inline-block; padding: 0 8px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
        .lr .st.done { background: rgba(16,185,129,.15); color: #047857; }
        .lr .st.wait { background: rgba(245,158,11,.18); color: #b9770e; }
        .lr .none { text-align: center; color: var(--sub-text); padding: 18px; }
        .lr th.ts, .lr td.ts { text-align: right; }
        .lr td.nm { position: sticky; left: 0; background: #fff; }
      `}</style>
      <div className="tb">
        {([['prog', '검사진행'], ['num', '검사결과(수치)'], ['ts', '시계열 조회']] as const).map(([k, l]) => <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'prog' && (
        <div className="sc">
          <table>
            <thead><tr><th>처방일</th><th>검사명</th><th>검체</th><th>진행</th><th>접수·채혈</th><th>결과</th></tr></thead>
            <tbody>
              {[...pending, ...done].map((r, k) => (
                <tr key={k}>
                  <td>{md(r.time) || '-'}</td><td>{r.name}</td><td>{r.sample}</td>
                  <td><span className={`st ${r.value ? 'done' : 'wait'}`}>{r.value ? '완료' : '검사 대기'}</span></td>
                  <td>{r.time ? `${md(r.time)} ${addMin(hmOf(r.time), -30)}` : ''}</td><td>{r.value ? '조회 가능' : ''}</td>
                </tr>
              ))}
              {data.labs.length === 0 && <tr><td colSpan={6} className="none">검사 처방이 없어요</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'num' && (
        <>
          <div className="op">
            <label>검사일
              <select value={cur} onChange={e => setSel(e.target.value)}>{dates.slice().reverse().map(d => <option key={d} value={d}>{d}</option>)}</select>
            </label>
            <label><input type="checkbox" checked={abn} onChange={e => setAbn(e.target.checked)} />Abnormal Only</label>
            <span>미확인 이상치 <b style={{ color: unack ? '#dc2626' : 'inherit' }}>{unack}건</b></span>
            <span style={{ marginLeft: 'auto', color: 'var(--sub-text)' }}>{rows.length}건 조회</span>
          </div>
          <div className="sc">
            <table>
              <thead><tr><th>검사코드</th><th>검사명</th><th>결과</th><th>단위</th><th>Min</th><th>Max</th><th>검체</th><th>접수일시</th><th>검사일시</th><th>보고일시</th><th>구분</th><th>판독의</th><th>확인</th></tr></thead>
              <tbody>
                {rows.map((r, k) => {
                  const f = flagOf(r);
                  const hm = hmOf(r.time) || '00:00';
                  return (
                    <tr key={k} className={f && !r.ack ? 'un' : ''}>
                      <td>{code(r.name || '')}</td><td>{r.name}</td>
                      <td className={`n ${f}`}>{mark(f)}{r.value}</td><td>{r.unit}</td><td className="n">{r.min}</td><td className="n">{r.max}</td><td>{r.sample}</td>
                      <td>{md(r.time)} {addMin(hm, -30)}</td><td>{md(r.time)} {addMin(hm, 0)}</td><td>{md(r.time)} {addMin(hm, 70)}</td>
                      <td>{/CRP|Troponin|Lactate|ABGA/i.test(r.name || '') ? '응급' : '정규'}</td><td>{reader(r.name || '')}</td>
                      <td>{r.ack ? <span title={r.ack}>확인</span> : f ? <button type="button" className="ab" onClick={() => ack(r)}>확인</button> : ''}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={13} className="none">{done.length ? '조회된 결과가 없어요' : '검사결과 없음'}</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'ts' && (
        <div className="sc">
          <table>
            <thead><tr><th>검사명</th><th>단위</th>{dates.map(d => <th key={d} className="ts">{d}</th>)}</tr></thead>
            <tbody>
              {names.map(n => {
                const unit = done.find(r => r.name === n)?.unit || '';
                return (
                  <tr key={n}>
                    <td className="nm">{n}</td><td>{unit}</td>
                    {dates.map(d => { const r = tsAt(n, d); const f = r ? flagOf({ ...done.find(x => x.name === n), ...r } as Row) : ''; return <td key={d} className={`n ts ${f}`}>{r ? `${mark(f)}${r.value}` : ''}</td>; })}
                  </tr>
                );
              })}
              {names.length === 0 && <tr><td colSpan={2 + dates.length} className="none">검사결과 없음</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
