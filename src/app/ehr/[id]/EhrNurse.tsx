'use client';

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { ChartData, Row } from '../types';

export type Roster = { id: string; ward: string | null; bed: string | null; name: string | null; ptNo: string | null; doctor: string | null };

const MENUS: { id: string; label: string }[] = [
  { id: 'notes', label: '간호기록' },
  { id: 'memos', label: '간호인수인계' },
  { id: 'vitals', label: '임상관찰' },
  { id: 'bst', label: '혈당·인슐린' },
  { id: 'nurseinfo', label: '간호정보조사지' },
  { id: 'care', label: '간호과정' },
  { id: 'nact', label: '간호행위' },
  { id: 'mat', label: '처치재료' },
  { id: 'ret', label: '약·주사 반납' },
  { id: 'consult', label: '협진' },
  { id: 'dir', label: '원내번호조회' },
];

const DIR: [string, string][] = [
  ['응급실', '2119'], ['중환자실', '2301'], ['수술실', '2410'], ['마취과', '2415'], ['영상의학과 (CT·MRI)', '2520'], ['진단검사의학과', '2610'], ['약제부', '2710'],
  ['영양팀', '2750'], ['원무과 (입퇴원)', '2800'], ['의료정보팀 (EMR)', '2910'], ['감염관리실', '2930'], ['재활의학과 (PT)', '2560'], ['내시경실', '2480'], ['혈액은행', '2630'],
];

const pad = (n: number) => String(n).padStart(2, '0');
const hm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dutyNow = () => { const h = new Date().getHours(); return h >= 6 && h < 14 ? 'D' : h >= 14 && h < 22 ? 'E' : 'N'; };
const isMed = (r: Row) => (r.dose || r.route) && !/^check/i.test(r.name || '');

type Item = { i: number; r: Row; notes: string[] };
type Groups = { base: Item[]; med: Item[]; prn: Item[]; lab: Item[] };

function group(orders: Row[]): Groups {
  const g: Groups = { base: [], med: [], prn: [], lab: [] };
  let sec = '';
  let last: Item | null = null;
  orders.forEach((r, i) => {
    if (r.kind === 'sec') { sec = r.name || ''; last = null; return; }
    if (r.kind === 'memo') { last?.notes.push(r.name || r.text || ''); return; }
    if (!(r.name || '').trim()) return;
    const it: Item = { i, r, notes: [] };
    last = it;
    if (r.pri === 'PRN') g.prn.push(it);
    else if (/검\s*사/.test(sec)) g.lab.push(it);
    else if (isMed(r)) g.med.push(it);
    else g.base.push(it);
  });
  return g;
}

// 검사·시술 예정에 따라 필요한 준비 항목
function checklist(d: ChartData): string[] {
  const text = [...d.sched.map(r => `${r.kind} ${r.name}`), ...d.orders.map(r => r.name || '')].join(' ');
  const out = ['금식', '동의서', '보호자'];
  if (/수술|시술|조영|관상동맥/.test(text)) out.push('수술·시술 부위 확인', '장신구·틀니 제거');
  if (/CT|조영/i.test(text)) out.push('조영제 알러지 확인');
  if (/내시경|endoscop|colonoscop/i.test(text)) out.push('장 정결 확인');
  if (/수혈|transfusion|PRBC|혈액/i.test(text)) out.push('혈액 준비 확인');
  if (/MRI/i.test(text)) out.push('금속 제거');
  return Array.from(new Set(out));
}

export default function EhrNurse({
  data, setData, userName, roster, win, onOpen, onClose, drawer, onChart, onLabel,
}: {
  data: ChartData;
  setData: Dispatch<SetStateAction<ChartData>>;
  userName: string;
  roster: Roster[];
  win: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  drawer: ReactNode;
  onChart: () => void;
  onLabel: () => void;
}) {
  const router = useRouter();
  const i = data.info;
  const [date, setDate] = useState(() => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; });
  const [ward, setWard] = useState(i.ward || '');
  const [team, setTeam] = useState('');
  const [duty, setDuty] = useState(dutyNow());
  const [q, setQ] = useState('');
  const [qMsg, setQMsg] = useState('');
  const [cmp, setCmp] = useState(false);
  const [msg, setMsg] = useState('');
  const [dq, setDq] = useState('');
  const g = useMemo(() => group(data.orders), [data.orders]);
  const wards = Array.from(new Set(roster.map(r => r.ward).filter((w): w is string => !!w)));
  const list = roster.filter(r => r.ward === ward).sort((a, b) => (a.bed || '').localeCompare(b.bed || '', 'ko', { numeric: true }));
  const flags = Array.from(new Set([...data.acu.map(r => r.risk), ...data.risk.filter(r => /고위험/.test(r.level || '')).map(r => (r.kind || '').split('(')[0])].filter(Boolean)));
  const dxMain = data.dxcode.find(r => r.kind === '주상병' && r.name);

  const patch = (idx: number, p: Row) => setData(d => ({ ...d, orders: d.orders.map((o, j) => (j === idx ? { ...o, ...p } : o)) }));
  const slots = (r: Row) => Object.keys(r).filter(k => /^t\d+$/.test(k) && r[k]).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const perform = (it: Item) => {
    const used = slots(it.r);
    const next = `t${(used.length ? Number(used[used.length - 1].slice(1)) : 0) + 1}`;
    const p: Row = { ck: '1', [next]: `${hm()} ${duty}/${userName}` };
    if (!isMed(it.r)) p.st = '완료';
    patch(it.i, p);
  };
  const undo = (it: Item) => {
    const used = slots(it.r);
    if (!used.length) return patch(it.i, { ck: '', st: it.r.st === '완료' ? '' : it.r.st });
    patch(it.i, { [used[used.length - 1]]: '', ck: used.length > 1 ? '1' : '' });
  };

  const memoOf = (t: string) => data.memos.filter(m => m.type === t);
  const sticky = data.memos.findIndex(m => m.type === '간호메모');
  const setSticky = (text: string) => setData(d => {
    const k = d.memos.findIndex(m => m.type === '간호메모');
    const row: Row = { type: '간호메모', text, time: `${date} ${hm()}`, author: userName, shift: duty };
    return { ...d, memos: k >= 0 ? d.memos.map((m, j) => (j === k ? { ...m, ...row } : m)) : [...d.memos, row] };
  });
  const sendMsg = () => {
    const t = msg.trim();
    if (!t) return;
    setData(d => ({ ...d, memos: [...d.memos, { type: '간호의사소통', text: t, time: `${date} ${hm()}`, author: userName, shift: duty }] }));
    setMsg('');
  };
  const ck = (label: string) => (i[`ck:${label}`] === '1') || (label === '금식' && i.npo === '1' && i['ck:금식'] !== '0');
  const toggle = (label: string) => setData(d => ({ ...d, info: { ...d.info, [`ck:${label}`]: ck(label) ? '0' : '1' } }));
  const find = () => {
    const t = q.trim();
    if (!t) return;
    const hit = roster.find(r => (r.ptNo || '').includes(t)) || roster.find(r => (r.name || '').includes(t));
    if (hit) router.push(`/ehr/${hit.id}`);
    else setQMsg('없는 환자예요');
  };

  const sec = (label: string, items: Item[], kind: 'med' | 'base' | 'prn' | 'lab') => (
    <section className="nsec">
      <h3>{label}</h3>
      {items.length === 0 && <p className="nnone">처방이 없어요.</p>}
      {items.map(it => {
        const r = it.r;
        const stop = r.pri === 'D/C' || r.st === '취소';
        const done = slots(r);
        return (
          <div key={it.i} className={`nrow ${stop ? 'x' : ''}`}>
            <div className="nm">
              <b>{r.name}</b>
              {(r.dose || r.route || r.cnt) && <span>{[r.dose && `${r.dose}${r.unit || ''}`, r.route, r.cnt, r.pri && r.pri !== 'D/C' ? r.pri : ''].filter(Boolean).join(' · ')}</span>}
              {kind === 'lab' && r.st && <span>{r.st}</span>}
              {it.notes.map((n, k) => <em key={k}>{n}</em>)}
            </div>
            <div className="nd">
              {done.map(k => <span key={k} className="chip">{r[k]}</span>)}
              {!stop && (
                <>
                  <button type="button" className="go" onClick={() => perform(it)}>수행</button>
                  {(done.length > 0 || r.ck) && <button type="button" onClick={() => undo(it)}>취소</button>}
                </>
              )}
              {stop && <span className="chip x">{r.pri === 'D/C' ? 'D/C' : '취소'}</span>}
            </div>
          </div>
        );
      })}
    </section>
  );

  const cl = checklist(data);
  const stat = (it: Item) => (it.r.st === '추가' ? '신규' : it.r.pri === 'D/C' ? '중지' : '유지');
  const all = [...g.base, ...g.med, ...g.prn, ...g.lab];

  return (
    <div className="nu">
      <div className="nmenu">
        <b>홈</b>
        {MENUS.map(m => <button key={m.id} type="button" className={win === m.id ? 'on' : ''} onClick={() => onOpen(m.id)}>{m.label}</button>)}
        <button type="button" className="ch" onClick={onChart}>전체 차트</button>
      </div>

      <div className="ngrid">
        <aside className="nl">
          <div className="nsr">
            <input value={q} onChange={e => { setQ(e.target.value); setQMsg(''); }} onKeyDown={e => e.key === 'Enter' && find()} placeholder="환자등록번호 검색" aria-label="환자등록번호 검색" />
            <button type="button" onClick={find}>검색</button>
          </div>
          {qMsg && <p className="nerr">{qMsg}</p>}
          <div className="npt">
            <b>{i.name || '이름 없음'} 님</b>
            <span>{[i.ageSex, i.ptNo].filter(Boolean).join(' · ')}</span>
            {dxMain || i.dx ? <span>{dxMain ? dxMain.name : i.dx}</span> : null}
            <div className="nflags">
              {flags.map(f => <em key={f}>{f}</em>)}
              {i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim()) && <em className="al">알러지 {i.allergy}</em>}
              {i.iso && i.iso !== '해당 없음' && i.iso !== '없음' && <em>{i.iso}</em>}
              {i.npo === '1' && <em>금식</em>}
            </div>
          </div>
          <div className="nbox">
            <h4>진료메모</h4>
            {memoOf('진료메모').slice(-3).reverse().map((m, k) => <p key={k}>{m.text}</p>)}
            {memoOf('진료메모').length === 0 && <p className="nnone">없음</p>}
          </div>
          <div className="nbox">
            <h4>간호의사소통</h4>
            {memoOf('간호의사소통').slice(-3).reverse().map((m, k) => <p key={k}>{m.text}<i>{(m.time || '').slice(-5)} {m.author}</i></p>)}
            <div className="nsr">
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="의사에게 전달할 내용" aria-label="간호의사소통" />
              <button type="button" onClick={sendMsg} disabled={!msg.trim()}>등록</button>
            </div>
          </div>
          <div className="nbox duty">
            <div className="nd3">
              <select value={ward} onChange={e => setWard(e.target.value)} aria-label="병동">
                {(wards.length ? wards : [i.ward || '']).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <input value={team} onChange={e => setTeam(e.target.value)} placeholder="팀" aria-label="팀" />
              <select value={duty} onChange={e => setDuty(e.target.value)} aria-label="듀티">
                {['D', 'E', 'N'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <table className="nlist">
              <thead><tr><th>병실</th><th>환자명</th><th>등록번호</th><th>주치의</th></tr></thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className={r.name === i.name && r.ptNo === i.ptNo ? 'on' : ''} onClick={() => router.push(`/ehr/${r.id}`)}>
                    <td>{r.bed}</td><td>{r.name}</td><td>{r.ptNo}</td><td>{r.doctor}</td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={4} className="nnone">열어 둔 환자가 없어요</td></tr>}
              </tbody>
            </table>
          </div>
        </aside>

        <main className="nc">
          <div className="nhd">
            <span>처방조회</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="처방조회일" />
            <button type="button" className="cmp" onClick={() => setCmp(true)}>전일처방비교</button>
          </div>
          {sec('기본처방', g.base, 'base')}
          {sec('투약', g.med, 'med')}
          {sec('투약 PRN 처방', g.prn, 'prn')}
          {sec('진단검사', g.lab, 'lab')}
          <div className="nft"><button type="button" onClick={onLabel}>투약라벨 출력</button></div>
        </main>

        <aside className="nr">
          <div className="nbox">
            <h4>체크리스트</h4>
            {cl.map(l => (
              <label key={l} className="ncb"><input type="checkbox" checked={ck(l)} onChange={() => toggle(l)} />{l}</label>
            ))}
          </div>
          <div className="nbox">
            <h4>간호메모</h4>
            <textarea className="nsticky" rows={9} value={sticky >= 0 ? data.memos[sticky].text || '' : ''} onChange={e => setSticky(e.target.value)} aria-label="간호메모" />
          </div>
        </aside>
      </div>

      {cmp && (
        <div className="nmd" role="dialog" aria-label="전일처방비교">
          <button type="button" className="nmk" aria-label="닫기" onClick={() => setCmp(false)} />
          <div className="nmb">
            <header><b>전일처방비교</b><button type="button" onClick={() => setCmp(false)}>닫기</button></header>
            <div className="nmc">
              {(['신규', '중지', '유지'] as const).map(s => {
                const rows = all.filter(it => stat(it) === s);
                return (
                  <div key={s}>
                    <h4>{s} ({rows.length})</h4>
                    {rows.length === 0 ? <p className="nnone">없음</p> : rows.map(it => <p key={it.i}>{it.r.name}</p>)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {win && (
        <div className="nwin" role="dialog" aria-label={win}>
          <header>
            <b>{MENUS.find(m => m.id === win)?.label}</b>
            <button type="button" onClick={onClose}>닫기</button>
          </header>
          <div className="nwb">
            {win === 'dir' ? (
              <>
                <input className="ndq" value={dq} onChange={e => setDq(e.target.value)} placeholder="부서 검색" aria-label="부서 검색" />
                <table className="nlist">
                  <tbody>
                    {DIR.filter(([n]) => n.includes(dq.trim())).map(([n, t]) => <tr key={n}><td>{n}</td><td>{t}</td></tr>)}
                  </tbody>
                </table>
              </>
            ) : drawer}
          </div>
        </div>
      )}

      <style>{`
        .nu { border: 1px solid #94a3b8; background: var(--background, #fff); color: var(--text); border-radius: 6px; overflow: hidden; font-size: 13px; position: relative; }
        .nmenu { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 0 8px; background: linear-gradient(#233a5c, #17283f); }
        .nmenu b { color: #e8c97a; padding: 0 12px 0 6px; }
        .nmenu button { border: 0; background: transparent; color: #e5ebf3; padding: 11px 12px; font: inherit; font-weight: 600; cursor: pointer; }
        .nmenu button.on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }
        .nmenu .ch { margin-left: auto; color: #e8c97a; }
        .ngrid { display: grid; grid-template-columns: 240px minmax(0, 1fr) 240px; min-height: 70vh; }
        .nl { border-right: 1px solid var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .nr { border-left: 1px solid var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .nc { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .nsr { display: flex; gap: 4px; }
        .nsr input { flex: 1; min-width: 0; border: 1px solid var(--border); border-radius: 6px; padding: 7px 8px; font: inherit; background: var(--background); color: var(--text); }
        .nsr button, .nd3 + * button { border: 1px solid var(--primary); background: var(--primary); color: #fff; border-radius: 6px; padding: 6px 10px; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .nsr button:disabled { opacity: .4; }
        .nerr { margin: 0; color: #dc2626; font-size: 12px; }
        .npt { background: var(--muted-background); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 3px; }
        .npt b { font-size: 20px; }
        .npt span { color: var(--sub-text); }
        .nflags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .nflags em { font-style: normal; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(245,158,11,.18); color: #b9770e; }
        .nflags em.al { background: rgba(239,68,68,.14); color: #dc2626; }
        .nbox h4 { margin: 0 0 6px; font-size: 13px; color: var(--sub-text); }
        .nbox p { margin: 0 0 6px; line-height: 1.4; white-space: pre-wrap; }
        .nbox p i { display: block; font-size: 11px; color: var(--sub-text); font-style: normal; }
        .nnone { color: var(--sub-text); margin: 4px 0; font-size: 12.5px; }
        .nd3 { display: flex; gap: 4px; margin-bottom: 6px; }
        .nd3 select, .nd3 input { min-width: 0; border: 1px solid var(--border); border-radius: 6px; padding: 6px; font: inherit; background: var(--background); color: var(--text); }
        .nd3 select:first-child { flex: 1.4; } .nd3 input { flex: 1; } .nd3 select:last-child { width: 52px; }
        .nlist { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .nlist th { text-align: left; color: var(--sub-text); font-weight: 600; padding: 4px; border-bottom: 1px solid var(--border); }
        .nlist td { padding: 5px 4px; border-bottom: 1px solid var(--border); }
        .nlist tbody tr { cursor: pointer; }
        .nlist tr.on { background: rgba(14,74,132,.12); font-weight: 700; }
        .nhd { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .nhd span { font-weight: 700; }
        .nhd input { border: 1px solid var(--border); border-radius: 6px; padding: 5px 8px; font: inherit; background: var(--background); color: var(--text); }
        .nhd .cmp { margin-left: auto; border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer; }
        .nsec h3 { margin: 0; padding: 6px 10px; background: #ececec; color: #111; text-align: center; font-size: 14px; border: 1px solid #aaa; }
        .nrow { display: flex; gap: 10px; justify-content: space-between; align-items: flex-start; padding: 8px 6px; border-bottom: 1px solid var(--border); }
        .nrow.x .nm b { text-decoration: line-through; opacity: .6; }
        .nm { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .nm span { color: var(--sub-text); font-size: 12px; }
        .nm em { font-style: normal; font-size: 12px; color: #b9770e; }
        .nd { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px; max-width: 55%; }
        .nd button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 6px; padding: 5px 10px; font: inherit; font-size: 12.5px; cursor: pointer; }
        .nd .go { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .chip { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: rgba(16,185,129,.14); color: #047857; font-weight: 700; white-space: nowrap; }
        .chip.x { background: rgba(100,116,139,.2); color: #475569; }
        .nft { display: flex; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 8px; margin-top: auto; }
        .nft button { border: 1px solid #aaa; background: #ececec; color: #111; border-radius: 6px; padding: 8px 16px; font: inherit; font-weight: 600; cursor: pointer; }
        .ncb { display: flex; align-items: center; gap: 8px; padding: 5px 2px; cursor: pointer; }
        .ncb input { width: 16px; height: 16px; }
        .nsticky { width: 100%; box-sizing: border-box; border: 1px solid #e6d9a3; border-radius: 6px; padding: 10px; font: inherit; background: #fcf1d0; color: #3b3320; resize: vertical; }
        .nmd { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 12px; }
        .nmk { position: absolute; inset: 0; border: 0; background: rgba(15,23,42,.45); }
        .nmb { position: relative; width: min(460px, 100%); max-height: 80vh; overflow: auto; background: var(--background, #fff); color: var(--text); border-radius: 12px; }
        .nmb header, .nwin header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .nmb header button, .nwin header button { border: 0; background: transparent; color: var(--sub-text); font: inherit; cursor: pointer; }
        .nmc { padding: 12px 16px 16px; } .nmc h4 { margin: 10px 0 4px; } .nmc p { margin: 0 0 4px; }
        .nwin { position: fixed; z-index: 55; top: 0; right: 0; bottom: 0; width: min(520px, 100%); background: var(--background, #fff); color: var(--text); border-left: 1px solid #94a3b8; box-shadow: -6px 0 24px rgba(0,0,0,.22); display: flex; flex-direction: column; }
        .nwb { padding: 12px 14px 24px; overflow: auto; flex: 1; }
        .ndq { width: 100%; box-sizing: border-box; border: 1px solid var(--border); border-radius: 6px; padding: 8px; font: inherit; margin-bottom: 8px; background: var(--background); color: var(--text); }
        @media (max-width: 980px) {
          .ngrid { grid-template-columns: 1fr; }
          .nl, .nr { border: 0; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}
