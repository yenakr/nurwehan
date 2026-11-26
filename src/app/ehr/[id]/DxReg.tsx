'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { vnow } from '../vclock';
import type { ChartData, Row } from '../types';
import { DX, dxName } from '../codes';

const p2 = (n: number) => String(n).padStart(2, '0');
const today = () => { const t = vnow(); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`; };
const FLAGS: [string, string][] = [['conf', '확정'], ['ro', 'R/O'], ['sp', 'S/P'], ['acu', '급성'], ['poa', 'PoA']];

// 상병등록 창: 임상진단 표(주진단·확정·R/O·S/P·급성·PoA)를 직접 추가·수정·삭제하고, 아래 탭에서 과거 이력을 본다
export default function DxReg({ data, setData, userName, onClose }: { data: ChartData; setData: Dispatch<SetStateAction<ChartData>>; userName: string; onClose: () => void }) {
  const i = data.info;
  const [tab, setTab] = useState<'main' | 'move'>('main');
  const [sel, setSel] = useState<number[]>([]);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const rows = data.dxcode;
  const upd = (k: number, patch: Row) => setData(d => ({ ...d, dxcode: d.dxcode.map((r, j) => (j === k ? { ...r, ...patch } : r)) }));
  const setMain = (k: number, on: boolean) => setData(d => ({ ...d, dxcode: d.dxcode.map((r, j) => (j === k ? { ...r, kind: on ? '주상병' : '부상병' } : on && r.kind === '주상병' ? { ...r, kind: '부상병' } : r)) }));
  const add = () => {
    const c = code.trim();
    const n = dxName(c) || DX.find(x => x[1] === c)?.[1];
    const cd = dxName(c) ? c.toUpperCase() : DX.find(x => x[1] === c)?.[0];
    if (!n || !cd) { setMsg('목록에 없는 상병입니다. 코드나 상병명을 검색해 선택하세요'); return; }
    if (rows.some(r => r.code === cd)) { setMsg('이미 등록된 상병입니다'); return; }
    setData(d => ({ ...d, dxcode: [...d.dxcode, { kind: d.dxcode.some(r => r.kind === '주상병') ? '부상병' : '주상병', code: cd, name: n, date: today(), doc: userName, conf: 'Y' }] }));
    setCode(''); setMsg('');
  };
  const del = () => { setData(d => ({ ...d, dxcode: d.dxcode.filter((_, j) => !sel.includes(j)) })); setSel([]); };
  const yr = (() => { const t = vnow(); t.setFullYear(t.getFullYear() - 1); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`; })();
  const hist = [...data.history].filter(r => (r.date || '') >= yr).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const moves = [...data.moves].sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  return (
    <div className="dr">
      <style>{`
        .dr { display: flex; flex-direction: column; height: 100%; min-height: 0; font-size: 12.5px; gap: 8px; }
        .dr-q { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }
        .dr-q label { display: inline-flex; gap: 6px; align-items: center; font-weight: 700; }
        .dr input[type='text'], .dr-q input { padding: 3px 6px; font-size: 12.5px; border: 1px solid var(--border); border-radius: 4px; }
        .dr table { min-width: 0 !important; width: 100%; border-collapse: collapse; }
        .dr th { background: #eaf0f7; border: 1px solid var(--border); padding: 4px 6px; white-space: nowrap; }
        .dr td { border: 1px solid #e3e8ef; padding: 3px 6px; text-align: center; }
        .dr td.l { text-align: left; }
        .dr-t { overflow: auto; flex: 1; min-height: 120px; border: 1px solid var(--border); }
        .dr-tb { display: flex; gap: 2px; }
        .dr-tb button { border: 1px solid var(--border); border-bottom: 0; border-radius: 4px 4px 0 0; background: #eef2f7; padding: 4px 12px; font: inherit; font-weight: 700; cursor: pointer; }
        .dr-tb button.on { background: #fff; color: var(--primary); }
        .dr-b { display: flex; gap: 8px; align-items: center; }
        .dr-b button { border: 1px solid var(--border); background: #fff; border-radius: 4px; padding: 4px 12px; font: inherit; font-weight: 700; cursor: pointer; }
        .dr-b button:disabled { opacity: .45; cursor: default; }
        .dr-none { color: var(--sub-text); padding: 12px; }
      `}</style>
      <div className="dr-q">
        <label>환자명 <input type="text" value={i.name || ''} readOnly style={{ width: 90 }} /></label>
        <label>진료과 <input type="text" value={i.dept || ''} readOnly style={{ width: 80 }} /></label>
        <label>구분 <input type="text" value={i.ward === '외래' ? '외래' : i.ward === '응급실' ? '응급' : '입원'} readOnly style={{ width: 50 }} /></label>
      </div>
      <b>임상진단</b>
      <div className="dr-t" style={{ flex: '0 0 auto', maxHeight: '38%' }}>
        <table>
          <thead><tr><th>선택</th><th>주진단</th><th>상병코드</th><th>상병명</th>{FLAGS.map(f => <th key={f[0]}>{f[1]}</th>)}<th>진단일</th><th>진단의</th></tr></thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                <td><input type="checkbox" aria-label="선택" checked={sel.includes(k)} onChange={e => setSel(s => (e.target.checked ? [...s, k] : s.filter(x => x !== k)))} /></td>
                <td><input type="checkbox" aria-label="주진단" checked={r.kind === '주상병'} onChange={e => setMain(k, e.target.checked)} /></td>
                <td>{r.code}</td><td className="l">{r.name}</td>
                {FLAGS.map(f => <td key={f[0]}><input type="checkbox" aria-label={f[1]} checked={r[f[0]] === 'Y'} onChange={e => upd(k, { [f[0]]: e.target.checked ? 'Y' : '' })} /></td>)}
                <td>{(r.date || '').slice(0, 10)}</td><td>{r.doc}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={10} className="dr-none">No data to display</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="dr-b">
        <input type="text" list="dr-dx" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="상병코드 또는 상병명 검색" aria-label="상병 검색" style={{ width: 260 }} />
        <datalist id="dr-dx">{code.trim().length >= 2 && DX.filter(x => x[0].toLowerCase().includes(code.trim().toLowerCase()) || x[1].includes(code.trim())).slice(0, 30).map(x => <option key={x[0]} value={x[0]}>{x[1]}</option>)}</datalist>
        <button type="button" onClick={add}>추가</button>
        <button type="button" onClick={del} disabled={sel.length === 0}>삭제</button>
        {msg && <span style={{ color: '#b45309', fontWeight: 700 }}>{msg}</span>}
        <button type="button" style={{ marginLeft: 'auto' }} onClick={onClose}>종료</button>
      </div>
      <div className="dr-tb">
        <button type="button" className={tab === 'main' ? 'on' : ''} onClick={() => setTab('main')}>최근 1년 주상병이력</button>
        <button type="button" className={tab === 'move' ? 'on' : ''} onClick={() => setTab('move')}>전과전동이력</button>
      </div>
      <div className="dr-t">
        {tab === 'main' ? (
          <table>
            <thead><tr><th>일자</th><th>구분</th><th>진료과</th><th>상병코드</th><th>상병명</th></tr></thead>
            <tbody>
              {hist.map((r, k) => <tr key={k}><td>{(r.date || '').slice(0, 10)}</td><td>{r.kind || '외래'}</td><td>{r.dept}</td><td>{r.code}</td><td className="l">{r.dx}</td></tr>)}
              {hist.length === 0 && <tr><td colSpan={5} className="dr-none">No data to display</td></tr>}
            </tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>일시</th><th>구분</th><th>전</th><th>후</th><th>사유</th></tr></thead>
            <tbody>
              {moves.map((r, k) => <tr key={k}><td>{r.time}</td><td>{r.type}</td><td>{r.from}</td><td>{r.to}</td><td className="l">{r.reason}</td></tr>)}
              {moves.length === 0 && <tr><td colSpan={5} className="dr-none">No data to display</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
