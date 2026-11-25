'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { ChartData, Row } from '../types';
import SearchPick, { type PickItem } from './SearchPick';
import { ACTS, MATS, MAT_INFO, actMats } from '../codes';
import { ACT_MASTER } from '../master';

const p2 = (n: number) => String(n).padStart(2, '0');
const todayStr = () => { const t = new Date(); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`; };
const nowStr = () => { const t = new Date(); return `${p2(t.getHours())}:${p2(t.getMinutes())}`; };
const stamp = (d: string, t: string) => `${d.slice(5)} ${t}`;

type Kind = 'vitals' | 'bst' | 'mat' | 'nact';
type Props = { kind: Kind; data: ChartData; setData: Dispatch<SetStateAction<ChartData>>; userName: string };

const num = (v: string) => (v.trim() === '' ? NaN : Number(v));

// 측정값 입력 범위(이 밖이면 오타로 보고 저장하지 않음)와 이상 기준(저장은 하되 의사 보고 안내)
const LIMITS: Record<string, { min: number; max: number; lo?: number; hi?: number; label: string }> = {
  sbp: { min: 40, max: 280, lo: 90, hi: 180, label: '수축기 혈압' },
  dbp: { min: 20, max: 180, lo: 50, hi: 110, label: '이완기 혈압' },
  hr: { min: 20, max: 250, lo: 50, hi: 120, label: '맥박' },
  rr: { min: 4, max: 70, lo: 10, hi: 24, label: '호흡' },
  bt: { min: 32, max: 43, lo: 35.5, hi: 38, label: '체온' },
  spo2: { min: 50, max: 100, lo: 92, label: 'SpO₂' },
  glu: { min: 10, max: 900, lo: 70, hi: 250, label: '혈당' },
};

export default function NurseForm({ kind, data, setData, userName }: Props) {
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowStr);
  const [f, setF] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => { setF(o => ({ ...o, [k]: v })); setMsg(''); };

  const matItems = useMemo<PickItem[]>(() => MATS.map(m => [m[0], `${MAT_INFO.get(m[0])?.cat || ''} · ${m[1]} · ${MAT_INFO.get(m[0])?.code || ''}`]), []);
  const actItems = useMemo<PickItem[]>(() => ACT_MASTER.map(a => [a.name, `${a.cat} · ${a.code}`]), []);

  const rows = (kind === 'vitals' ? data.vitals : kind === 'bst' ? data.bst : kind === 'mat' ? data.mat : data.nact) as Row[];
  const recent = rows.slice(-6).reverse();

  const check = (key: keyof typeof LIMITS, v: string): { bad: boolean; warn: boolean } => {
    const n = num(v);
    if (Number.isNaN(n)) return { bad: false, warn: false };
    const L = LIMITS[key];
    return { bad: n < L.min || n > L.max, warn: (L.lo !== undefined && n < L.lo) || (L.hi !== undefined && n > L.hi) };
  };

  const save = () => {
    const ts = stamp(date, time);
    if (!/^\d{2}:\d{2}$/.test(time)) { setMsg('시간을 확인하세요'); return; }
    if (kind === 'vitals') {
      const keys: [string, string][] = [['sbp', f.sbp || ''], ['dbp', f.dbp || ''], ['hr', f.hr || ''], ['rr', f.rr || ''], ['bt', f.bt || ''], ['spo2', f.spo2 || '']];
      if ((f.sbp && !f.dbp) || (!f.sbp && f.dbp)) { setMsg('혈압은 수축기와 이완기를 함께 입력하세요'); return; }
      if (f.sbp && f.dbp && Number(f.sbp) <= Number(f.dbp)) { setMsg('수축기 혈압이 이완기 혈압보다 커야 해요'); return; }
      for (const [k, v] of keys) if (v && check(k, v).bad) { setMsg(`${LIMITS[k].label} 값을 확인하세요`); return; }
      if (![f.sbp, f.hr, f.rr, f.bt, f.spo2, f.pain].some(x => x)) { setMsg('측정한 항목을 입력하세요'); return; }
      const warns = keys.filter(([k, v]) => v && check(k, v).warn).map(([k]) => LIMITS[k].label);
      const row: Row = { time, bp: f.sbp ? `${f.sbp}/${f.dbp}` : '', sbp: f.sbp || '', dbp: f.dbp || '', hr: f.hr || '', rr: f.rr || '', bt: f.bt || '', spo2: f.spo2 || '', pain: f.pain || '', by: userName };
      setData(d => ({ ...d, vitals: [...d.vitals, row] }));
      setF({});
      setTime(nowStr());
      setMsg(warns.length ? `저장했어요. ${warns.join(', ')} 이상 수치, 담당의 보고가 필요한지 확인하세요.` : '저장했어요.');
    } else if (kind === 'bst') {
      if (!f.glu) { setMsg('혈당 값을 입력하세요'); return; }
      if (check('glu', f.glu).bad) { setMsg('혈당 값을 확인하세요'); return; }
      if (f.ins && !f.dose) { setMsg('인슐린 용량을 입력하세요'); return; }
      if (f.dose && !f.ins) { setMsg('인슐린 종류를 선택하세요'); return; }
      const w = check('glu', f.glu).warn;
      const row: Row = { time: ts, meal: f.meal || '', glu: f.glu, ins: f.ins || '', dose: f.dose || '', site: f.site || '', note: f.note || '', by: userName };
      setData(d => ({ ...d, bst: [...d.bst, row] }));
      setF({});
      setTime(nowStr());
      setMsg(w ? '저장했어요. 혈당 이상 수치, 처방에 따른 조치와 보고를 확인하세요.' : '저장했어요.');
    } else if (kind === 'mat') {
      if (cart.length === 0) { setMsg('재료를 추가하세요'); return; }
      const out = cart.map(c => ({ ...c, time: ts, by: userName }));
      setData(d => ({ ...d, mat: [...d.mat, ...out] }));
      setCart([]);
      setF({});
      setMsg('저장했어요.');
    } else {
      if (!f.act) { setMsg('간호행위를 선택하세요'); return; }
      if (!ACTS.some(a => a[0] === f.act)) { setMsg('목록에서 간호행위를 선택하세요'); return; }
      const row: Row = { time: ts, act: f.act, mat: f.mat || '', by: userName, st: '수행', note: f.note || '' };
      const used: Row[] = actMats(f.act).map(([item, qty]) => ({ time: ts, item, qty: String(qty), unit: MATS.find(m => m[0] === item)?.[1] || 'ea', act: f.act, by: userName }));
      setData(d => ({ ...d, nact: [...d.nact, row], mat: [...d.mat, ...used] }));
      setF({});
      setMsg('저장했어요.');
    }
  };

  const addCart = () => {
    const item = (f.item || '').trim();
    if (!MATS.some(m => m[0] === item)) { setMsg('목록에서 재료를 선택하세요'); return; }
    const q = Number(f.qty || '1');
    if (!Number.isInteger(q) || q < 1 || q > 99) { setMsg('수량을 확인하세요'); return; }
    setCart(c => [...c, { item, qty: String(q), unit: MATS.find(m => m[0] === item)?.[1] || 'ea', act: f.act || '' }]);
    setF(o => ({ ...o, item: '', qty: '' }));
    setMsg('');
  };

  const N = (k: keyof typeof LIMITS, label: string, unit?: string, w = 90) => {
    const v = f[k] || '';
    const c = check(k, v);
    return (
      <label className="nf-f" style={{ width: w }}>
        <span>{label}</span>
        <input inputMode="decimal" className={c.bad ? 'bad' : c.warn ? 'warn' : ''} value={v} onChange={e => set(k, e.target.value.replace(/[^0-9.]/g, ''))} />
        {unit && <i>{unit}</i>}
      </label>
    );
  };

  return (
    <div className="nf">
      <div className="nf-time">
        {kind !== 'vitals' && <label>일자<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>}
        <label>시간<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
        <span>입력자 {userName}</span>
      </div>

      {kind === 'vitals' && (
        <div className="nf-row">
          <label className="nf-f" style={{ width: 150 }}>
            <span>혈압</span>
            <div className="nf-bp">
              <input inputMode="numeric" className={check('sbp', f.sbp || '').bad ? 'bad' : check('sbp', f.sbp || '').warn ? 'warn' : ''} value={f.sbp || ''} onChange={e => set('sbp', e.target.value.replace(/\D/g, ''))} aria-label="수축기" />
              <b>/</b>
              <input inputMode="numeric" className={check('dbp', f.dbp || '').bad ? 'bad' : check('dbp', f.dbp || '').warn ? 'warn' : ''} value={f.dbp || ''} onChange={e => set('dbp', e.target.value.replace(/\D/g, ''))} aria-label="이완기" />
            </div>
            <i>mmHg</i>
          </label>
          {N('hr', '맥박', '/min')}
          {N('rr', '호흡', '/min')}
          {N('bt', '체온', '℃')}
          {N('spo2', 'SpO₂', '%')}
          <label className="nf-f" style={{ width: 90 }}>
            <span>통증</span>
            <select value={f.pain || ''} onChange={e => set('pain', e.target.value)}>
              <option value="" />
              {Array.from({ length: 11 }, (_, n) => <option key={n} value={`NRS ${n}`}>{n}</option>)}
            </select>
          </label>
        </div>
      )}

      {kind === 'bst' && (
        <div className="nf-row">
          <label className="nf-f" style={{ width: 120 }}>
            <span>시점</span>
            <select value={f.meal || ''} onChange={e => set('meal', e.target.value)}>
              {['', '식전', '식후 2h', '취침 전', '새벽', '수시'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          {N('glu', '혈당', 'mg/dL')}
          <label className="nf-f" style={{ width: 150 }}>
            <span>인슐린</span>
            <select value={f.ins || ''} onChange={e => set('ins', e.target.value)}>
              {['', 'Humalog (초속효)', 'Novorapid (초속효)', 'Humulin R (속효)', 'Lantus (지속형)', 'Tresiba (지속형)'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="nf-f" style={{ width: 80 }}>
            <span>용량</span>
            <input inputMode="numeric" value={f.dose || ''} onChange={e => set('dose', e.target.value.replace(/\D/g, ''))} />
            <i>U</i>
          </label>
          <label className="nf-f" style={{ width: 120 }}>
            <span>주사 부위</span>
            <select value={f.site || ''} onChange={e => set('site', e.target.value)}>
              {['', '복부 좌', '복부 우', '대퇴 좌', '대퇴 우', '상완 좌', '상완 우'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="nf-f" style={{ flex: 1, minWidth: 160 }}>
            <span>비고</span>
            <input value={f.note || ''} onChange={e => set('note', e.target.value)} />
          </label>
        </div>
      )}

      {kind === 'mat' && (
        <>
          <div className="nf-row">
            <label className="nf-f" style={{ flex: 1, minWidth: 220 }}>
              <span>처치재료</span>
              <SearchPick items={matItems} value={f.item || ''} onChange={v => set('item', v)} />
            </label>
            <label className="nf-f" style={{ width: 70 }}>
              <span>수량</span>
              <input inputMode="numeric" value={f.qty || ''} onChange={e => set('qty', e.target.value.replace(/\D/g, ''))} />
            </label>
            <label className="nf-f" style={{ flex: 1, minWidth: 200 }}>
              <span>관련 행위</span>
              <SearchPick items={actItems} value={f.act || ''} onChange={v => set('act', v)} />
            </label>
            <button type="button" className="nf-add" onClick={addCart}>추가</button>
            {actMats(f.act || '').length > 0 && <button type="button" className="nf-add" onClick={() => { setCart(c => [...c, ...actMats(f.act || '').map(([item, q]) => ({ item, qty: String(q), unit: MATS.find(m => m[0] === item)?.[1] || 'ea', act: f.act || '' }))]); setMsg(''); }}>행위 기본재료 담기</button>}
          </div>
          {cart.length > 0 && (
            <table className="nf-t">
              <thead><tr><th>처치재료</th><th>수량</th><th>단위</th><th>관련 행위</th><th /></tr></thead>
              <tbody>
                {cart.map((c, i) => (
                  <tr key={i}><td>{c.item}</td><td>{c.qty}</td><td>{c.unit}</td><td>{c.act}</td><td><button type="button" aria-label="삭제" onClick={() => setCart(x => x.filter((_, j) => j !== i))}>&times;</button></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {kind === 'nact' && (
        <div className="nf-row">
          <label className="nf-f" style={{ flex: 1, minWidth: 240 }}>
            <span>간호행위</span>
            <SearchPick items={actItems} value={f.act || ''} onChange={v => { set('act', v); const m = actMats(v).map(([n, q]) => `${n} x${q}`).join(', '); setF(o => ({ ...o, act: v, mat: m })); }} />
          </label>
          <label className="nf-f" style={{ flex: 1, minWidth: 180 }}>
            <span>사용 재료</span>
            <input value={f.mat || ''} onChange={e => set('mat', e.target.value)} />
          </label>
          <label className="nf-f" style={{ flex: 1, minWidth: 180 }}>
            <span>비고</span>
            <input value={f.note || ''} onChange={e => set('note', e.target.value)} />
          </label>
        </div>
      )}

      <div className="nf-act">
        {msg && <span className={/확인|입력|선택|추가|커야/.test(msg) && !msg.startsWith('저장') ? 'err' : /이상/.test(msg) ? 'warn' : 'ok'}>{msg}</span>}
        <button type="button" onClick={() => { setF({}); setCart([]); setMsg(''); }}>지우기</button>
        <button type="button" className="go" onClick={save}>저장</button>
      </div>

      <h4>최근 기록</h4>
      <table className="nf-t">
        <thead>
          <tr>
            {kind === 'vitals' && <><th>시간</th><th>수축기</th><th>이완기</th><th>맥박</th><th>호흡</th><th>체온</th><th>SpO₂</th><th>통증</th><th>입력자</th></>}
            {kind === 'bst' && <><th>일시</th><th>시점</th><th>혈당</th><th>인슐린</th><th>용량</th><th>부위</th><th>입력자</th></>}
            {kind === 'mat' && <><th>일시</th><th>처치재료</th><th>수량</th><th>단위</th><th>관련 행위</th><th>입력자</th></>}
            {kind === 'nact' && <><th>일시</th><th>간호행위</th><th>사용 재료</th><th>수행자</th><th>상태</th></>}
          </tr>
        </thead>
        <tbody>
          {recent.map((r, i) => (
            <tr key={i}>
              {kind === 'vitals' && <><td>{r.time}</td><td>{r.sbp ?? (r.bp || '').split('/')[0]}</td><td>{r.dbp ?? (r.bp || '').split('/')[1]}</td><td>{r.hr}</td><td>{r.rr}</td><td>{r.bt}</td><td>{r.spo2}</td><td>{r.pain}</td><td>{r.by}</td></>}
              {kind === 'bst' && <><td>{r.time}</td><td>{r.meal}</td><td>{r.glu}</td><td>{r.ins}</td><td>{r.dose}</td><td>{r.site}</td><td>{r.by}</td></>}
              {kind === 'mat' && <><td>{r.time}</td><td>{r.item}</td><td>{r.qty}</td><td>{r.unit}</td><td>{r.act}</td><td>{r.by}</td></>}
              {kind === 'nact' && <><td>{r.time}</td><td>{r.act}</td><td>{r.mat}</td><td>{r.by}</td><td>{r.st}</td></>}
            </tr>
          ))}
          {recent.length === 0 && <tr><td colSpan={8} className="nf-none">기록 없음</td></tr>}
        </tbody>
      </table>

      <style>{`
        .nf { padding: 14px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; }
        .nf h4 { margin: 6px 0 0; font-size: 13px; color: var(--sub-text); }
        .nf-time { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .nf-time label { display: flex; align-items: center; gap: 6px; font-weight: 700; }
        .nf-time input { width: auto; padding: 5px 8px; }
        .nf-time span { color: var(--sub-text); margin-left: auto; }
        .nf-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
        .nf-f { display: flex; flex-direction: column; gap: 3px; position: relative; }
        .nf-f > span { font-weight: 700; font-size: 12px; }
        .nf-f > i { position: absolute; right: 8px; bottom: 8px; font-style: normal; font-size: 11px; color: var(--sub-text); pointer-events: none; }
        .nf-f input, .nf-f select { width: 100%; padding: 7px 8px; min-height: 34px; }
        .nf-f input.warn { background: rgba(245,158,11,.18); }
        .nf-f input.bad { background: rgba(239,68,68,.16); outline: 1px solid #dc2626; }
        .nf-bp { display: flex; align-items: center; gap: 4px; }
        .nf-bp input { min-width: 0; }
        .nf-add { padding: 7px 16px; min-height: 34px; border: 1px solid var(--primary); background: transparent; color: var(--primary); font-weight: 700; border-radius: 4px; cursor: pointer; }
        .nf-act { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
        .nf-act span { margin-right: auto; font-weight: 700; }
        .nf-act span.err { color: #dc2626; }
        .nf-act span.warn { color: #b9770e; }
        .nf-act span.ok { color: #2f7a46; }
        .nf-act button { padding: 7px 18px; border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 4px; cursor: pointer; font-weight: 700; }
        .nf-act button.go { background: var(--primary); color: #fff; border-color: var(--primary); }
        .nf-t { width: 100%; min-width: 0; table-layout: auto; border-collapse: collapse; }
        .nf-t th { background: var(--muted-background); border: 1px solid var(--border); padding: 5px 6px; font-size: 12px; }
        .nf-t td { border: 1px solid var(--border); padding: 5px 6px; text-align: center; }
        .nf-t td button { border: 0; background: transparent; color: var(--sub-text); cursor: pointer; }
        .nf-none { color: var(--sub-text); }
      `}</style>
    </div>
  );
}
