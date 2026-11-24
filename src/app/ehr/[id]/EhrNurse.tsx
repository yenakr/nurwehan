'use client';

import { SAMPLES } from '../samples';
import { MATS, matsFor } from '../codes';
import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { ChartData, Row } from '../types';
import WardBulk, { type BulkPt } from '../WardBulk';

export type Roster = { id: string; ward: string | null; bed: string | null; name: string | null; ageSex: string | null; ptNo: string | null; doctor: string | null; admit?: string | null; disDate?: string | null };

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
  { id: 'bulk', label: '활력징후 일괄' },
  { id: 'handover', label: '인수인계지' },
  { id: 'adm', label: '입퇴원 예정' },
  { id: 'dir', label: '원내번호조회' },
];

const DIR: [string, string][] = [
  ['응급실', '2119'], ['중환자실', '2301'], ['수술실', '2410'], ['마취과', '2415'], ['영상의학과 (CT·MRI)', '2520'], ['진단검사의학과', '2610'], ['약제부', '2710'],
  ['영양팀', '2750'], ['원무과 (입퇴원)', '2800'], ['의료정보팀 (EMR)', '2910'], ['감염관리실', '2930'], ['재활의학과 (PT)', '2560'], ['내시경실', '2480'], ['혈액은행', '2630'],
];

const pad = (n: number) => String(n).padStart(2, '0');
const hm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dutyNow = () => { const h = new Date().getHours(); return h >= 6 && h < 14 ? 'D' : h >= 14 && h < 22 ? 'E' : 'N'; };
const HIGH = /(insulin|인슐린|heparin|헤파린|potassium|kcl|칼륨|morphine|모르핀|fentanyl|펜타닐|midazolam|미다졸람|항암|digoxin|디곡신|warfarin|와파린|propofol|ketamine|마약)/i;
// 병실 기준 담당 팀: 1~3호실 1팀, 4호실 이후 2팀
const teamOf = (bed: string | null) => ((Number((bed || '').split('-')[0]) || 0) % 100 <= 3 ? '1팀' : '2팀');
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

// 수술·시술·검사 예정마다 필요한 준비 항목. 해당 없으면 비어 있다.
type CkGroup = { title: string; items: string[] };
function checklist(d: ChartData): CkGroup[] {
  const src: [string, string][] = [
    ...d.sched.map((r): [string, string] => [r.kind || '', r.name || '']),
    ...d.surgery.filter(r => r.name).map((r): [string, string] => ['수술', r.name || '']),
    ...d.orders.filter(r => r.kind !== 'sec' && r.kind !== 'memo' && r.pri !== 'D/C' && r.name).map((r): [string, string] => ['', r.name || '']),
  ];
  const out: CkGroup[] = [];
  const seen = new Set<string>();
  src.forEach(([kind, name]) => {
    const t = `${kind} ${name}`;
    let items: string[] = [];
    let label = kind || '검사';
    if (/수술|시술|관상동맥/.test(t)) { items = ['금식', '동의서', '보호자', '수술·시술 부위 확인', '장신구·틀니 제거']; label = /시술/.test(t) && !/수술/.test(t) ? '시술' : '수술'; }
    else if (/내시경|endoscop|colonoscop/i.test(t)) { items = ['금식', '동의서', '장 정결 확인']; label = '검사'; }
    else if (/CT|조영/i.test(t)) { items = ['금식', '동의서', '조영제 알러지 확인']; label = '검사'; }
    else if (/MRI/i.test(t)) { items = ['동의서', '금속 제거']; label = '검사'; }
    else if (/수혈|transfusion|PRBC|혈액/i.test(t)) { items = ['동의서', '혈액 준비 확인']; label = '수혈'; }
    if (!items.length || !name.trim()) return;
    const title = `${label} · ${name.trim()}`;
    if (seen.has(title)) return;
    seen.add(title);
    out.push({ title, items });
  });
  return out;
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
  const [team, setTeam] = useState(() => teamOf(i.bed || ''));
  const [dmsg, setDmsg] = useState('');
  const [duty, setDuty] = useState(dutyNow());
  const [q, setQ] = useState('');
  const [qMsg, setQMsg] = useState('');
  const [cmp, setCmp] = useState(false);
  const [msg, setMsg] = useState('');
  const [dq, setDq] = useState('');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [chk, setChk] = useState<Item | null>(null);
  const [c5, setC5] = useState<Record<string, boolean>>({});
  const [dbl, setDbl] = useState('');
  const g = useMemo(() => group(data.orders), [data.orders]);
  const wards = Array.from(new Set(roster.map(r => r.ward).filter((w): w is string => !!w)));
  const list = roster.filter(r => r.ward === ward && (team === '전체' || teamOf(r.bed) === team)).sort((a, b) => (a.bed || '').localeCompare(b.bed || '', 'ko', { numeric: true }));
  const flags = Array.from(new Set([...data.acu.map(r => r.risk), ...data.risk.filter(r => /고위험/.test(r.level || '')).map(r => (r.kind || '').split('(')[0])].filter(Boolean)));
  const bulkPts: BulkPt[] = list.map(r => ({ key: r.id, bed: r.bed || '', name: r.name || '', ageSex: r.ageSex || '', id: r.id, make: () => ({ title: '', subject: null, data: {} }) }));
  const shift = (n: number) => {
    const [y, m, d0] = date.split('-').map(Number);
    if (!y) return;
    const t = new Date(y, m - 1, d0 + n);
    setDate(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`);
  };
  const [adate, setAdate] = useState(date);
  const shiftA = (n: number) => {
    const [y, m, d0] = adate.split('-').map(Number);
    if (!y) return;
    const t = new Date(y, m - 1, d0 + n);
    setAdate(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`);
  };
  const admRows = (adm: boolean) => {
    const rows: Roster[] = [...roster];
    const have = new Set(roster.map(r => r.ptNo));
    SAMPLES.forEach(sp => {
      const x = sp.data.info;
      if (!x.ward || x.ward === '외래' || x.ward === '응급실' || have.has(x.ptNo || '')) return;
      rows.push({ id: '', ward: x.ward, bed: x.bed || '', name: x.name || '', ageSex: x.ageSex || '', ptNo: x.ptNo || '', doctor: x.doctor || '', admit: x.admit, disDate: x.disDate });
    });
    return rows.filter(r => (adm ? (r.admit || '') : (r.disDate || '')).slice(0, 10) === adate);
  };
  const dd = (v?: string) => (v || '').slice(0, 10);
  const dayN = (from?: string) => {
    const f = dd(from);
    if (!f) return '';
    const n = Math.round((new Date(date).getTime() - new Date(f).getTime()) / 86400000) + 1;
    return n > 0 ? `${n}일째` : '';
  };
  const dxMain = data.dxcode.find(r => r.kind === '주상병' && r.name);

  const patch = (idx: number, p: Row) => setData(d => ({ ...d, orders: d.orders.map((o, j) => (j === idx ? { ...o, ...p } : o)) }));
  const slots = (r: Row) => Object.keys(r).filter(k => /^t\d+$/.test(k) && r[k]).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const perform = (it: Item) => {
    const used = slots(it.r);
    const next = `t${(used.length ? Number(used[used.length - 1].slice(1)) : 0) + 1}`;
    const p: Row = { ck: '1', [next]: `${hm()} ${duty}/${userName}` };
    if (!isMed(it.r)) p.st = '완료';
    patch(it.i, p);
    const used2 = matsFor(it.r);
    if (used2.length) {
      const act = isMed(it.r) ? '투약' : (it.r.name || '');
      setData(d => ({ ...d, mat: [...d.mat, ...used2.map(([item, qty]): Row => ({ time: `${date.slice(5)} ${hm()}`, item, qty: String(qty), unit: MATS.find(m => m[0] === item)?.[1] || 'ea', act, by: userName }))] }));
    }
  };
  const ask = (it: Item) => {
    if (isMed(it.r)) { setC5({}); setDbl(''); setChk(it); } else perform(it);
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
  const addMemo = (type: string, t: string, done: () => void) => {
    const text = t.trim();
    if (!text) return;
    setData(d => ({ ...d, memos: [...d.memos, { type, text, time: `${date} ${hm()}`, author: userName, shift: duty }] }));
    done();
  };
  const sendMsg = () => addMemo('간호의사소통', msg, () => setMsg(''));
  const sendDoc = () => addMemo('진료메모', dmsg, () => setDmsg(''));
  const ck = (label: string) => (i[`ck:${label}`] === '1') || (label.endsWith('/금식') && i.npo === '1' && i[`ck:${label}`] !== '0');
  const toggle = (label: string) => setData(d => ({ ...d, info: { ...d.info, [`ck:${label}`]: ck(label) ? '0' : '1' } }));
  const find = () => {
    const t = q.trim();
    if (!t) return;
    const hit = roster.find(r => (r.ptNo || '').includes(t)) || roster.find(r => (r.name || '').includes(t));
    if (hit) router.push(`/ehr/${hit.id}`);
    else setQMsg('없는 환자예요');
  };

  const sec = (label: string, items: Item[], kind: 'med' | 'base' | 'prn' | 'lab') => (
    <section className="ns-nsec">
      <h3>{label}</h3>
      {items.length === 0 && <p className="ns-nnone">처방이 없어요.</p>}
      {items.map(it => {
        const r = it.r;
        const stop = r.pri === 'D/C' || r.st === '취소';
        const done = slots(r);
        return (
          <div key={it.i} className={`ns-nrow ${stop ? 'ns-x' : ''}`}>
            <div className="ns-nm">
              <b>{r.name}</b>
              {(r.dose || r.route || r.cnt) && <span>{[r.dose && `${r.dose}${r.unit || ''}`, r.route, r.cnt, r.pri && r.pri !== 'D/C' ? r.pri : ''].filter(Boolean).join(' · ')}</span>}
              {kind === 'lab' && r.st && <span>{r.st}</span>}
              {it.notes.map((n, k) => <em key={k}>{n}</em>)}
            </div>
            <div className="ns-nd">
              {done.map(k => <span key={k} className="ns-chip">{r[k]}</span>)}
              {!stop && (
                <>
                  <button type="button" className="ns-go" onClick={() => ask(it)}>수행</button>
                  {(done.length > 0 || r.ck) && <button type="button" onClick={() => undo(it)}>취소</button>}
                </>
              )}
              {stop && <span className="ns-chip ns-x">{r.pri === 'D/C' ? 'D/C' : '취소'}</span>}
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
    <div className={`ns-nu ${win ? 'ns-hasw' : ''}`}>
      <div className="ns-nmenu">
        <b>홈</b>
        {MENUS.map(m => <button key={m.id} type="button" className={win === m.id ? 'ns-on' : ''} onClick={() => (m.id === 'handover' ? router.push(`/ehr/handover?ward=${encodeURIComponent(ward)}`) : onOpen(m.id))}>{m.label}</button>)}
        <button type="button" className="ns-ch" onClick={onChart}>전체 차트</button>
      </div>

      <div className="ns-ngrid">
        <aside className="ns-nl">
          <div className="ns-nsr">
            <input value={q} onChange={e => { setQ(e.target.value); setQMsg(''); }} onKeyDown={e => e.key === 'Enter' && find()} aria-label="환자환자번호 검색" />
            <button type="button" onClick={find}>검색</button>
          </div>
          {qMsg && <p className="ns-nerr">{qMsg}</p>}
          <div className="ns-npt">
            <b>{i.name || '이름 없음'} 님</b>
            <span>{[i.ageSex, i.ptNo].filter(Boolean).join(' · ')}</span>
            {dd(i.admit) && <span>입원일 {dd(i.admit)} {dayN(i.admit) && `(${dayN(i.admit)})`}</span>}
            {dd(i.disDate) && <span>퇴원예정일 {dd(i.disDate)}</span>}
            {data.surgery[0] && dd(data.surgery[0].date) && <span>수술일 {dd(data.surgery[0].date)}</span>}
            {i.dept && <span>{[i.dept, i.doctor].filter(Boolean).join(' · ')}</span>}
            {i.ward && <span>{[i.ward, i.bed].filter(Boolean).join(' ')}</span>}
            {dxMain || i.dx ? <span>{dxMain ? dxMain.name : i.dx}</span> : null}
            <div className="ns-nflags">
              {flags.map(f => <em key={f}>{f}</em>)}
              {i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim()) && <em className="ns-al">알러지 {i.allergy}</em>}
              {i.iso && i.iso !== '해당 없음' && i.iso !== '없음' && <em>{i.iso}</em>}
              {i.npo === '1' && <em>금식</em>}
            </div>
          </div>
          <div className="ns-nbox">
            <h4>진료메모</h4>
            {memoOf('진료메모').slice(-3).reverse().map((m, k) => <p key={k}>{m.text}<i>{(m.time || '').slice(-5)} {m.author}</i></p>)}
            {memoOf('진료메모').length === 0 && <p className="ns-nnone">없음</p>}
            <div className="ns-nsr">
              <input value={dmsg} onChange={e => setDmsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendDoc()} aria-label="진료메모" />
              <button type="button" onClick={sendDoc} disabled={!dmsg.trim()}>등록</button>
            </div>
          </div>
          <div className="ns-nbox">
            <h4>간호의사소통</h4>
            {memoOf('간호의사소통').slice(-3).reverse().map((m, k) => <p key={k}>{m.text}<i>{(m.time || '').slice(-5)} {m.author}</i></p>)}
            <div className="ns-nsr">
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} aria-label="간호의사소통" />
              <button type="button" onClick={sendMsg} disabled={!msg.trim()}>등록</button>
            </div>
          </div>
          <div className="ns-nbox ns-duty">
            <div className="ns-nd3">
              <select value={ward} onChange={e => setWard(e.target.value)} aria-label="병동">
                {(wards.length ? wards : [i.ward || '']).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select value={team} onChange={e => setTeam(e.target.value)} aria-label="팀">
                {['전체', '1팀', '2팀'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={duty} onChange={e => setDuty(e.target.value)} aria-label="듀티">
                {['D', 'E', 'N'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <table className="ns-nlist">
              <thead><tr><th>병실</th><th>환자명</th><th>환자번호</th><th>주치의</th></tr></thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className={r.name === i.name && r.ptNo === i.ptNo ? 'ns-on' : ''} onClick={() => router.push(`/ehr/${r.id}`)}>
                    <td>{r.bed}</td><td>{r.name}</td><td>{r.ptNo}</td><td>{r.doctor}</td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={4} className="ns-nnone">열어 둔 환자가 없어요</td></tr>}
              </tbody>
            </table>
          </div>
        </aside>

        <main className="ns-nc">
          <div className="ns-nhd">
            <span>처방조회</span>
            <button type="button" className="ns-arw" onClick={() => shift(-1)} aria-label="전날">&lt;</button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="처방조회일" />
            <button type="button" className="ns-arw" onClick={() => shift(1)} aria-label="다음날">&gt;</button>
            <button type="button" className="ns-cmp" onClick={() => setCmp(true)}>전일처방비교</button>
          </div>
          {sec('기본처방', g.base, 'base')}
          {sec('투약', g.med, 'med')}
          {sec('투약 PRN 처방', g.prn, 'prn')}
          {sec('진단검사', g.lab, 'lab')}
          <div className="ns-nft"><button type="button" onClick={onLabel}>투약라벨 출력</button></div>
        </main>

        <aside className="ns-nr">
          {cl.map(g => (
            <div key={g.title} className="ns-nbox">
              <h4>체크리스트 · {g.title}</h4>
              {g.items.map(l => (
                <label key={l} className="ns-ncb"><input type="checkbox" checked={ck(`${g.title}/${l}`)} onChange={() => toggle(`${g.title}/${l}`)} />{l}</label>
              ))}
            </div>
          ))}
          <div className="ns-nbox">
            <h4>간호메모</h4>
            <textarea className="ns-nsticky" rows={9} value={sticky >= 0 ? data.memos[sticky].text || '' : ''} onChange={e => setSticky(e.target.value)} aria-label="간호메모" />
          </div>
        </aside>
      </div>

      {cmp && (
        <div className="ns-nmd" role="dialog" aria-label="전일처방비교">
          <button type="button" className="ns-nmk" aria-label="닫기" onClick={() => setCmp(false)} />
          <div className="ns-nmb">
            <header><b>전일처방비교</b><button type="button" onClick={() => setCmp(false)}>닫기</button></header>
            <div className="ns-nmc">
              {(['신규', '중지', '유지'] as const).map(s => {
                const rows = all.filter(it => stat(it) === s);
                return (
                  <div key={s}>
                    <h4>{s} ({rows.length})</h4>
                    {rows.length === 0 ? <p className="ns-nnone">없음</p> : rows.map(it => <p key={it.i}>{it.r.name}</p>)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {chk && (() => {
        const r = chk.r;
        const al = (i.allergy || '').replace(/\(.*\)/, '').trim();
        const warn = al && !/^(없음|무|none|-)$/i.test(al) && (r.name || '').toLowerCase().includes(al.toLowerCase());
        const high = HIGH.test(r.name || '');
        const need = ['p', 'd', 'q', 'r', 't', ...(warn ? ['a'] : [])];
        const ok = need.every(k => c5[k]) && (!high || dbl.trim().length > 0);
        const row = (k: string, label: string) => <label className="ns-ncb"><input type="checkbox" checked={!!c5[k]} onChange={e => setC5(c => ({ ...c, [k]: e.target.checked }))} />{label}</label>;
        return (
          <div className="ns-nmd" role="dialog" aria-label="투약 확인">
            <button type="button" className="ns-nmk" aria-label="닫기" onClick={() => setChk(null)} />
            <div className="ns-nmb">
              <header><b>투약 확인</b><button type="button" onClick={() => setChk(null)}>닫기</button></header>
              <div className="ns-nmc">
                {row('p', `환자: ${i.name || ''} (${i.ptNo || ''})`)}
                {row('d', `약물: ${r.name}`)}
                {row('q', `용량: ${r.dose || ''}${r.unit || ''}`)}
                {row('r', `경로: ${r.route || '-'}`)}
                {row('t', `시간: ${hm()} (처방 시간 전후 30분 이내)`)}
                {warn && <div className="ns-nwarn">{row('a', `알러지 주의: ${i.allergy}. 처방의에게 확인했나요?`)}</div>}
                {high && (
                  <div className="ns-nwarn">
                    <p>고위험 약물: 용량, 농도, 펌프 설정을 둘이서 확인하세요.</p>
                    <input className="ns-ndq" value={dbl} onChange={e => setDbl(e.target.value)} aria-label="이중확인자" />
                  </div>
                )}
                <div className="ns-nfa">
                  <button type="button" onClick={() => setChk(null)}>취소</button>
                  <button type="button" className="ns-go" disabled={!ok} onClick={() => { perform(chk); setChk(null); }}>투약 완료</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {win && (
        <div className="ns-nwin" role="dialog" aria-label={win} style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto', margin: 0 } : undefined}>
          <header
            onPointerDown={e => {
              if ((e.target as HTMLElement).closest('button')) return;
              const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              const dx = e.clientX - box.left;
              const dy = e.clientY - box.top;
              const move = (ev: PointerEvent) => setPos({ x: Math.max(0, ev.clientX - dx), y: Math.max(0, ev.clientY - dy) });
              const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
            }}
          >
            <b>{MENUS.find(m => m.id === win)?.label}</b>
            <button type="button" aria-label="닫기" onClick={onClose}>&times;</button>
          </header>
          <div className="ns-nwb">
            {win === 'adm' ? (
              <>
                <div className="ns-nhd">
                  <button type="button" className="ns-arw" onClick={() => shiftA(-1)} aria-label="전날">&lt;</button>
                  <input type="date" value={adate} onChange={e => setAdate(e.target.value)} aria-label="조회일" />
                  <button type="button" className="ns-arw" onClick={() => shiftA(1)} aria-label="다음날">&gt;</button>
                </div>
                {([['입원', admRows(true)], ['퇴원예정', admRows(false)]] as const).map(([t, rows]) => (
                  <div key={t}>
                    <h4>{t} ({rows.length})</h4>
                    <table className="ns-nlist">
                      <thead><tr><th>병동</th><th>병상</th><th>환자명</th><th>환자번호</th><th>주치의</th></tr></thead>
                      <tbody>
                        {rows.map(r => <tr key={r.ptNo + t}><td>{r.ward}</td><td>{r.bed}</td><td>{r.name}</td><td>{r.ptNo}</td><td>{r.doctor}</td></tr>)}
                        {rows.length === 0 && <tr><td colSpan={5} className="ns-nnone">없음</td></tr>}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            ) : win === 'dir' ? (
              <>
                <input className="ns-ndq" value={dq} onChange={e => setDq(e.target.value)} aria-label="부서 검색" />
                <table className="ns-nlist">
                  <tbody>
                    {DIR.filter(([n]) => n.includes(dq.trim())).map(([n, t]) => <tr key={n}><td>{n}</td><td>{t}</td></tr>)}
                  </tbody>
                </table>
              </>
            ) : win === 'bulk' ? (
              <WardBulk pts={bulkPts} onClose={onClose} />
            ) : drawer}
          </div>
        </div>
      )}

      <style>{`
        .ns-nu { border: 1px solid #94a3b8; background: var(--background, #fff); color: var(--text); border-radius: 6px; overflow: hidden; font-size: 13px; position: relative; }
        .ns-nmenu { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 0 8px; background: linear-gradient(#233a5c, #17283f); }
        .ns-nmenu b { color: #e8c97a; padding: 0 12px 0 6px; }
        .ns-nmenu button { border: 0; background: transparent; color: #e5ebf3; padding: 11px 12px; font: inherit; font-weight: 600; cursor: pointer; }
        .ns-nmenu button.ns-on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }
        .ns-nmenu .ns-ch { margin-left: auto; color: #e8c97a; }
        .ns-ngrid { display: grid; grid-template-columns: 240px minmax(0, 1fr) 240px; min-height: 70vh; }
        .ns-nl { border-right: 1px solid var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .ns-nr { border-left: 1px solid var(--border); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .ns-nc { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .ns-nsr { display: flex; gap: 4px; }
        .ns-nsr input { flex: 1; min-width: 0; border: 1px solid var(--border); border-radius: 6px; padding: 7px 8px; font: inherit; background: var(--background); color: var(--text); }
        .ns-nsr button, .ns-nd3 + * button { border: 1px solid var(--primary); background: var(--primary); color: #fff; border-radius: 6px; padding: 6px 10px; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .ns-nsr button:disabled { opacity: .4; }
        .ns-nerr { margin: 0; color: #dc2626; font-size: 12px; }
        .ns-npt { background: var(--muted-background); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 3px; }
        .ns-arw { padding: 4px 10px; border: 1px solid var(--border); background: var(--background); color: var(--primary); font-weight: 700; border-radius: 4px; }
        .ns-npt b { font-size: 20px; }
        .ns-npt span { color: var(--sub-text); }
        .ns-nflags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .ns-nflags em { font-style: normal; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(245,158,11,.18); color: #b9770e; }
        .ns-nflags em.ns-al { background: rgba(239,68,68,.14); color: #dc2626; }
        .ns-nbox h4 { margin: 0 0 6px; font-size: 13px; color: var(--sub-text); }
        .ns-nbox p { margin: 0 0 6px; line-height: 1.4; white-space: pre-wrap; }
        .ns-nbox p i { display: block; font-size: 11px; color: var(--sub-text); font-style: normal; }
        .ns-nnone { color: var(--sub-text); margin: 4px 0; font-size: 12.5px; }
        .ns-nd3 { display: flex; gap: 4px; margin-bottom: 6px; }
        .ns-nd3 select, .ns-nd3 input { min-width: 0; border: 1px solid var(--border); border-radius: 6px; padding: 6px; font: inherit; background: var(--background); color: var(--text); }
        .ns-nd3 select { flex: 1; } .ns-nd3 select:last-child { flex: 0 0 56px; }
        .ns-nlist { width: 100%; min-width: 0; table-layout: fixed; border-collapse: collapse; font-size: 12.5px; }
        .ns-nlist td, .ns-nlist th { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ns-nlist th { text-align: left; color: var(--sub-text); font-weight: 600; padding: 4px; border-bottom: 1px solid var(--border); }
        .ns-nlist td { padding: 5px 4px; border-bottom: 1px solid var(--border); }
        .ns-nlist tbody tr { cursor: pointer; }
        .ns-nlist tr.ns-on { background: rgba(14,74,132,.12); font-weight: 700; }
        .ns-nhd { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .ns-nhd span { font-weight: 700; }
        .ns-nhd input { border: 1px solid var(--border); border-radius: 6px; padding: 5px 8px; font: inherit; background: var(--background); color: var(--text); }
        .ns-nhd .ns-cmp { margin-left: auto; border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer; }
        .ns-nsec h3 { margin: 0; padding: 6px 10px; background: #ececec; color: #111; text-align: center; font-size: 14px; border: 1px solid #aaa; }
        .ns-nrow { display: flex; gap: 10px; justify-content: space-between; align-items: flex-start; padding: 8px 6px; border-bottom: 1px solid var(--border); }
        .ns-nrow.ns-x .ns-nm b { text-decoration: line-through; opacity: .6; }
        .ns-nm { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ns-nm span { color: var(--sub-text); font-size: 12px; }
        .ns-nm em { font-style: normal; font-size: 12px; color: #b9770e; }
        .ns-nd { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px; max-width: 55%; }
        .ns-nd button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 6px; padding: 5px 10px; font: inherit; font-size: 12.5px; cursor: pointer; }
        .ns-nd .ns-go { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .ns-chip { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: rgba(16,185,129,.14); color: #047857; font-weight: 700; white-space: nowrap; }
        .ns-chip.ns-x { background: rgba(100,116,139,.2); color: #475569; }
        .ns-nft { display: flex; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 8px; margin-top: auto; }
        .ns-nft button { border: 1px solid #aaa; background: #ececec; color: #111; border-radius: 6px; padding: 8px 16px; font: inherit; font-weight: 600; cursor: pointer; }
        .ns-ncb { display: flex; align-items: center; gap: 8px; padding: 5px 2px; cursor: pointer; }
        .ns-ncb input { width: 16px; height: 16px; }
        .ns-nsticky { width: 100%; box-sizing: border-box; border: 1px solid #e6d9a3; border-radius: 6px; padding: 10px; font: inherit; background: #fcf1d0; color: #3b3320; resize: vertical; }
        .ns-nmd { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 12px; }
        .ns-nmk { position: absolute; inset: 0; border: 0; background: rgba(15,23,42,.45); }
        .ns-nmb { position: relative; width: min(460px, 100%); max-height: 80vh; overflow: auto; background: var(--background, #fff); color: var(--text); border-radius: 12px; }
        .ns-nwin header { background: linear-gradient(#233a5c, #17283f); color: #fff; cursor: move; touch-action: none; padding: 8px 12px; border-bottom: 0; }
        .ns-nmb header, .ns-nwin header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .ns-nmb header button, .ns-nwin header button { border: 0; background: transparent; color: var(--sub-text); font: inherit; cursor: pointer; }
        .ns-nmc { padding: 12px 16px 16px; } .ns-nmc h4 { margin: 10px 0 4px; } .ns-nmc p { margin: 0 0 4px; }
        .ns-nwarn { background: rgba(239,68,68,.1); border-radius: 8px; padding: 6px 10px; margin-top: 6px; }
        .ns-nwarn p { margin: 4px 0; font-size: 12.5px; color: #dc2626; font-weight: 700; }
        .ns-nfa { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
        .ns-nfa button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 8px; padding: 8px 18px; font: inherit; font-weight: 600; cursor: pointer; }
        .ns-nfa .ns-go { background: var(--primary); border-color: var(--primary); color: #fff; }
        .ns-nfa .ns-go:disabled { opacity: .4; }
        .ns-nwin { position: fixed; z-index: 55; inset: 0; margin: auto; width: min(920px, 94vw); height: min(680px, 86vh); min-width: 320px; min-height: 240px; resize: both; overflow: hidden; background: var(--background, #fff); color: var(--text); border: 1px solid #1c2f4b; box-shadow: 0 12px 40px rgba(0,0,0,.35); display: flex; flex-direction: column; border-radius: 6px; }
        .ns-nwin header button { color: #fff; font-size: 22px; line-height: 1; padding: 0 6px; }
        .ns-nwb .wbk { border: 0; padding: 0; margin: 0; }
        .ns-nwb { padding: 12px 14px 24px; overflow: auto; flex: 1; }
        .ns-ndq { width: 100%; box-sizing: border-box; border: 1px solid var(--border); border-radius: 6px; padding: 8px; font: inherit; margin-bottom: 8px; background: var(--background); color: var(--text); }
        @media (max-width: 980px) {
          .ns-ngrid { grid-template-columns: 1fr; }
          .ns-nl, .ns-nr { border: 0; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}
