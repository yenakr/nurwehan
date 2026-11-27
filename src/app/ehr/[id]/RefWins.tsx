'use client';

import { Fragment, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { vnow } from '../vclock';
import type { ChartData, Row } from '../types';
import { group, viewOrders, type Item } from '../ordday';
import { USAGE, KIND_LABEL } from '../usage';

const p2 = (n: number) => String(n).padStart(2, '0');
const ymd = (t: Date) => `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`;
const addD = (ds: string, n: number) => { const t = new Date(`${ds}T00:00:00`); t.setDate(t.getDate() + n); return ymd(t); };
type SD = Dispatch<SetStateAction<ChartData>>;

const CSS = `
  .rw { display: flex; flex-direction: column; height: 100%; min-height: 0; font-size: 12.5px; gap: 8px; }
  .rw-q { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; }
  .rw label { display: inline-flex; gap: 5px; align-items: center; }
  .rw-q b, .rw .bd { font-weight: 700; }
  .rw input[type='text'], .rw input[type='date'], .rw input[type='time'], .rw input[type='number'], .rw select, .rw textarea { padding: 3px 6px; font: inherit; border: 1px solid var(--border); border-radius: 4px; background: #fff; }
  .rw textarea { width: 100%; resize: vertical; }
  .rw .req { border-color: #ef4444 !important; }
  .rw table { min-width: 0 !important; width: 100%; border-collapse: collapse; }
  .rw th { background: #eaf0f7; border: 1px solid var(--border); padding: 4px 6px; white-space: nowrap; position: sticky; top: 0; }
  .rw td { border: 1px solid #e3e8ef; padding: 3px 6px; }
  .rw td.c { text-align: center; }
  .rw .sc { overflow: auto; flex: 1; min-height: 0; border: 1px solid var(--border); }
  .rw .band td { background: #d4ecec; font-weight: 800; }
  .rw button { border: 1px solid var(--border); background: #fff; border-radius: 4px; padding: 4px 12px; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .rw button.p { background: var(--primary); border-color: var(--primary); color: #fff; }
  .rw button:disabled { opacity: .45; cursor: default; }
  .rw .bar { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
  .rw .msg { color: #1a7f4b; font-weight: 700; margin-right: auto; }
  .rw .none { padding: 14px; text-align: center; color: var(--sub-text); }
  .rw .box { border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; display: flex; flex-wrap: wrap; gap: 6px 18px; }
  .rw .box h5 { flex: 0 0 100%; margin: 0; font-size: 12.5px; }
  .rw .l1 { color: #2563eb; } .rw .l2 { color: #ea580c; } .rw .l3 { color: #dc2626; }
`;

// ─── 전처방 비교 ───
const INJ = /^(IV|IM|SC|ID|IVF|IV\s?push|INJ)/i;
export function RxCompare({ data, onClose }: { data: ChartData; onClose: () => void }) {
  const today = ymd(vnow());
  const [D, setD] = useState(today);
  const [kinds, setKinds] = useState<Record<string, boolean>>({ memo: false, base: true, med: true, lab: true });
  const [diffOnly, setDiffOnly] = useState(false);
  const side = (day: string) => {
    const g = group(viewOrders(data, day, today));
    const det = (it: Item) => ({ name: it.r.name || '', qty: it.r.dose || '', unit: it.r.unit || '', cnt: it.r.cnt || '', route: it.r.route || '', note: it.notes.join(' '), pri: it.r.pri || '' });
    return {
      base: g.base.map(det),
      inj: g.med.filter(m => INJ.test(m.r.route || '')).map(det),
      po: g.med.filter(m => !INJ.test(m.r.route || '')).map(det),
      prn: g.prn.map(det),
      lab: g.lab.map(det),
    };
  };
  const L = useMemo(() => side(addD(D, -1)), [data, D]); // eslint-disable-line react-hooks/exhaustive-deps
  const R = useMemo(() => side(D), [data, D]); // eslint-disable-line react-hooks/exhaustive-deps
  type Cell = ReturnType<typeof side>['base'][number] | undefined;
  const same = (a: Cell, b: Cell) => !!a && !!b && a.qty === b.qty && a.cnt === b.cnt && a.route === b.route && a.note === b.note;
  const sections: { key: string; label: string; show: boolean; l: Cell[]; r: Cell[] }[] = [
    { key: 'base', label: '기본', show: kinds.base, l: L.base, r: R.base },
    { key: 'inj', label: '주사약', show: kinds.med, l: L.inj, r: R.inj },
    { key: 'po', label: '경구약', show: kinds.med, l: L.po, r: R.po },
    { key: 'prn', label: '약상 PRN', show: kinds.med, l: L.prn, r: R.prn },
    { key: 'lab', label: '검사', show: kinds.lab, l: L.lab, r: R.lab },
  ];
  const aligned = (l: Cell[], r: Cell[]) => {
    const used = new Set<number>();
    const rows: { a: Cell; b: Cell }[] = l.map(a => {
      const j = r.findIndex((x, k) => !used.has(k) && x?.name === a?.name);
      if (j >= 0) used.add(j);
      return { a, b: j >= 0 ? r[j] : undefined };
    });
    r.forEach((b, k) => { if (!used.has(k)) rows.push({ a: undefined, b }); });
    return rows;
  };
  const K = (a: Cell, c: 'qty' | 'unit' | 'cnt' | 'route' | 'note') => (a ? a[c] : '');
  return (
    <div className="rw">
      <style>{CSS}</style>
      <div className="rw-q">
        <b>처방일자</b>
        <button type="button" onClick={() => setD(addD(D, -1))} aria-label="전날">◀</button>
        <input type="date" value={D} onChange={e => e.target.value && setD(e.target.value)} />
        <button type="button" onClick={() => setD(addD(D, 1))} aria-label="다음날">▶</button>
        <b style={{ marginLeft: 12 }}>구분</b>
        {['전체', '외래', '입원', '응급'].map(k => <label key={k}><input type="radio" name="rc-k" checked={k === (data.info.ward === '외래' ? '외래' : data.info.ward === '응급실' ? '응급' : '입원')} readOnly />{k}</label>)}
        <label style={{ marginLeft: 'auto' }}><input type="checkbox" checked={diffOnly} onChange={e => setDiffOnly(e.target.checked)} />변경된 처방만</label>
      </div>
      <div className="rw-q">
        <b>환자명 : {data.info.name}({data.info.ptNo})</b>
        <span className="box" style={{ padding: '3px 10px', gap: 14 }}>
          <label><input type="checkbox" checked={kinds.memo} onChange={e => setKinds(k => ({ ...k, memo: e.target.checked }))} />메모</label>
          <label><input type="checkbox" checked={kinds.base} onChange={e => setKinds(k => ({ ...k, base: e.target.checked }))} />기본</label>
          <label><input type="checkbox" checked={kinds.med} onChange={e => setKinds(k => ({ ...k, med: e.target.checked }))} />약/주사</label>
          <label><input type="checkbox" checked={kinds.lab} onChange={e => setKinds(k => ({ ...k, lab: e.target.checked }))} />검사</label>
        </span>
      </div>
      <div className="sc">
        <table>
          <thead>
            <tr><th colSpan={7}>전처방일 : {addD(D, -1)}</th><th colSpan={7}>처방일 : {D}</th><th rowSpan={2}>비교</th></tr>
            <tr>{[0, 1].flatMap(s => ['No', '처방명', '수량', '단위', '횟수', '용법', '특기사항'].map(h => <th key={`${s}${h}`}>{h}</th>))}</tr>
          </thead>
          <tbody>
            {sections.filter(s => s.show).map(s => {
              const rows = aligned(s.l, s.r).filter(r => !diffOnly || !same(r.a, r.b));
              return (
                <Fragment key={s.key}><FragmentRows label={s.label} rows={rows} K={K} same={same} /></Fragment>
              );
            })}
            {sections.every(s => !s.show || (s.l.length === 0 && s.r.length === 0)) && <tr><td colSpan={15} className="none">No data to display</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="bar"><button type="button" onClick={onClose}>종료</button></div>
    </div>
  );
}
function FragmentRows({ label, rows, K, same }: { label: string; rows: { a: any; b: any }[]; K: any; same: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!rows.length) return null;
  return (
    <>
      <tr className="band"><td colSpan={15}>▶ {label} ◀</td></tr>
      {rows.map((r, k) => {
        const diff = !same(r.a, r.b);
        const bg = diff ? { background: '#eaf2ff' } : undefined;
        return (
          <tr key={k} style={bg}>
            <td className="c">{r.a ? k + 1 : ''}</td><td>{r.a?.name}</td><td className="c">{K(r.a, 'qty')}</td><td className="c">{K(r.a, 'unit')}</td><td className="c">{K(r.a, 'cnt')}</td><td className="c">{K(r.a, 'route')}</td><td>{K(r.a, 'note')}</td>
            <td className="c">{r.b ? k + 1 : ''}</td><td style={!r.a && r.b ? { color: '#dc2626', fontWeight: 700 } : undefined}>{r.b?.name}</td><td className="c">{K(r.b, 'qty')}</td><td className="c">{K(r.b, 'unit')}</td><td className="c">{K(r.b, 'cnt')}</td><td className="c">{K(r.b, 'route')}</td><td>{K(r.b, 'note')}</td>
            <td className="c"><input type="checkbox" checked={diff} readOnly aria-label="변경됨" /></td>
          </tr>
        );
      })}
    </>
  );
}

// ─── 환자향후일정조회 ───
export function FutureSched({ data, onClose }: { data: ChartData; onClose: () => void }) {
  const today = ymd(vnow());
  const [from, setFrom] = useState(addD(today, -180));
  const [to, setTo] = useState(addD(today, 365));
  const TYPES = ['검사', '진료', '약상담', '치방', '영양상담', '약주사', '병리', '건진', '재활치료', '당뇨상담'];
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(TYPES.map(t => [t, true])));
  const [pick, setPick] = useState<Record<number, boolean>>({});
  const [go, setGo] = useState(0);
  const rows = useMemo(() => {
    const out = data.appts.filter(a => a.st !== '취소').map(a => ({ at: `${a.date || ''} ${a.time || ''}`.trim(), kind: '진료', dept: a.dept || '', place: '', doc: a.doc || '', purpose: a.purpose || '', paid: 'N' }));
    return out.filter(r => on[r.kind] && r.at.slice(0, 10) >= from && r.at.slice(0, 10) <= to).sort((a, b) => a.at.localeCompare(b.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.appts, on, from, to, go]);
  const csv = () => {
    const head = ['순번', '예약일시', '구분', '진료과', '진료의', '비고', '수납'];
    const body = rows.map((r, k) => [k + 1, r.at, r.kind, r.dept, r.doc, r.purpose, r.paid]);
    const text = [head, ...body].map(l => l.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
    a.download = `환자향후일정_${data.info.ptNo || ''}.csv`;
    a.click();
  };
  return (
    <div className="rw">
      <style>{CSS}</style>
      <div className="rw-q">
        <label><b>환자번호</b><input type="text" value={data.info.ptNo || ''} readOnly style={{ width: 100 }} /></label>
        <input type="text" value={data.info.name || ''} readOnly style={{ width: 80 }} />
        <input type="text" value={(data.info.ageSex || '').split('/')[0] || ''} readOnly style={{ width: 36 }} />
        <label><b>진료과</b><input type="text" value="" readOnly style={{ width: 120 }} placeholder="전체" /></label>
        <label><b>처방일자</b><input type="date" value={from} onChange={e => setFrom(e.target.value)} />~<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <span className="box" style={{ padding: '3px 10px', gap: '2px 14px', flex: 1, minWidth: 360 }}>
          {TYPES.map(t => <label key={t}><input type="checkbox" checked={on[t]} onChange={e => setOn(o => ({ ...o, [t]: e.target.checked }))} />{t}</label>)}
        </span>
        <button type="button" className="p" onClick={() => setGo(g => g + 1)}>조회 (F2)</button>
      </div>
      <b className="l1">환자향후일정 목록</b>
      <div className="sc">
        <table>
          <thead><tr><th>선택</th><th>순번</th><th>예약일시</th><th>구분</th><th>진료과</th><th>진료의</th><th>비고</th><th>수납</th></tr></thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                <td className="c"><input type="checkbox" checked={pick[k] !== false} onChange={e => setPick(p => ({ ...p, [k]: e.target.checked }))} aria-label="선택" /></td>
                <td className="c">{k + 1}</td><td className="c">{r.at}</td><td className="c">{r.kind}</td><td className="c">{r.dept}</td><td className="c">{r.doc}</td><td>{r.purpose}</td><td className="c">{r.paid}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="none">No data to display</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="bar"><button type="button" onClick={csv} disabled={rows.length === 0}>엑셀</button><button type="button" onClick={onClose}>종료 (Esc)</button></div>
    </div>
  );
}

// ─── 스티커 출력 ───
export function Sticker({ data, onClose }: { data: ChartData; onClose: () => void }) {
  const i = data.info;
  const [n, setN] = useState('1');
  const [kind, setKind] = useState<'name' | 'med' | 'kid' | 'adult'>('name');
  const [done, setDone] = useState('');
  const [prev, setPrev] = useState(false);
  const KINDS: [typeof kind, string, string][] = [['name', '환자이름표', 'SEWOO Label Printer(Z)'], ['med', '약카용이름표', 'SEWOO Label Printer(Z)'], ['kid', '소아용팔찌', ''], ['adult', '성인용팔찌', 'Kyocera ECOSYS P3045dn KX']];
  const print = () => {
    const c = Math.max(1, Math.min(20, Number(n) || 1));
    setDone(`${KINDS.find(k => k[0] === kind)?.[1]} ${c}매 출력되었습니다`);
    setPrev(true);
  };
  return (
    <div className="rw">
      <style>{CSS}</style>
      <div className="box" style={{ flexDirection: 'column' }}>
        <label><b className="l3">* 등록정보</b><input type="text" value={i.ptNo || ''} readOnly style={{ width: 90 }} /><input type="text" value={i.name || ''} readOnly style={{ width: 70 }} /><input type="text" value={i.ageSex || ''} readOnly style={{ width: 80 }} /></label>
        <label style={{ marginLeft: 70 }}><input type="text" value={[i.ward, i.bed].filter(Boolean).join('-')} readOnly style={{ width: 120 }} /><input type="text" value={i.dept || ''} readOnly style={{ width: 90 }} /></label>
      </div>
      <label><b className="l3">* 출력매수</b><input type="number" min={1} max={20} value={n} onChange={e => setN(e.target.value)} className="req" style={{ width: 60 }} /></label>
      {KINDS.map(([k, l, pr]) => (
        <div key={k} className="rw-q" style={{ borderBottom: k === 'med' ? '1px dashed var(--border)' : undefined, paddingBottom: k === 'med' ? 8 : 0 }}>
          <label style={{ minWidth: 120 }}><input type="radio" name="st-k" checked={kind === k} onChange={() => setKind(k)} /><b>{l}</b></label>
          <select disabled={kind !== k} value={pr} onChange={() => {}} style={{ minWidth: 240 }}><option>{pr}</option></select>
          <b>트레이</b>
          <select disabled={kind !== k} style={{ minWidth: 150 }}><option>15=자동 선택</option><option>1=Tray 1</option></select>
        </div>
      ))}
      {prev && (
        <div className="box" style={{ justifyContent: 'center', background: '#fafafa' }}>
          <div style={{ border: '1px dashed #888', padding: '8px 14px', background: '#fff', minWidth: 240 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{i.name} <small>({i.ageSex})</small></div>
            <div>{i.ptNo} · {[i.ward, i.bed].filter(Boolean).join(' ')}</div>
            <div>{i.dept} · {i.blood ? `Blood ${i.blood}` : ''}</div>
            {i.allergy && <div className="l3">Allergy: {i.allergy}</div>}
          </div>
        </div>
      )}
      <div className="bar" style={{ marginTop: 'auto' }}>
        {done && <span className="msg">{done}</span>}
        <button type="button" className="p" onClick={print}>출력</button>
        <button type="button" onClick={onClose}>종료</button>
      </div>
    </div>
  );
}

// ─── 공통업무지원 의뢰 ───
const TREAT = ['L-tube 삽입', 'L-tube 제거', 'Floey 삽입', 'Floey 제거', 'Chemo-port needle 삽입', 'Chemo-port needle 제거', 'CVC, PICC 제거', '투약', '지혈용 Q패드 제거', '배액관 연결 및 교환', '배액관 세척', '배액관 제거', 'A-line 삽입', 'A-line 제거', 'G-enema', 'Leclean enema', 'Retention enema', '조영제 투여'];
const DRESS = ['머리', '목', '등', '엉덩이', '가슴', '복부', 'Rt팔', 'Lt팔', 'Rt다리', 'Lt다리', '기타'];
const EXAMS = ['ABGA', 'blood culture', 'PTBD', 'PCN', 'PCD', 'ENBD', 'chest tube', 'Swab 검사', 'Tracheal aspiration', 'Covid 19 검체', 'EKG(portable)'];
export function CommonReq({ data, setData, userName, onMat, onClose }: { data: ChartData; setData: SD; userName: string; onMat: () => void; onClose: () => void }) {
  const i = data.info;
  const [date, setDate] = useState(ymd(vnow()));
  const [cat, setCat] = useState<Record<string, boolean>>({});
  const [tr, setTr] = useState<string[]>([]);
  const [dr, setDr] = useState<string[]>([]);
  const [drSite, setDrSite] = useState<string[]>([]);
  const [ex, setEx] = useState<string[]>([]);
  const [ban, setBan] = useState<'none' | 'has'>('none');
  const [banSite, setBanSite] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('미지정');
  const [tm, setTm] = useState('00:00');
  const [msg, setMsg] = useState('');
  const tg = (a: string[], set: (v: string[]) => void, x: string) => set(a.includes(x) ? a.filter(y => y !== x) : [...a, x]);
  const reqs = data.memos.filter(m => m.type === 'cmnreq');
  const save = () => {
    const parts = [
      cat.consent && '동의서',
      ...tr.map(x => `치료술기: ${x}`),
      ...(cat.dress || dr.length ? [`드레싱: ${dr.join(', ')}${drSite.length ? ` (부위 ${drSite.join('/')})` : ''}`] : []),
      ...ex.map(x => `검사: ${x}${ban === 'has' && banSite.length ? ` (금지부위 ${banSite.join('/')})` : ''}`),
    ].filter(Boolean) as string[];
    if (!parts.length) { setMsg('의뢰 항목을 선택하세요'); return; }
    const t = vnow();
    setData(d => ({ ...d, memos: [...d.memos, { type: 'cmnreq', date, text: parts.join(' / '), note, when: when === '시간지정' ? tm : when, author: userName, time: `${p2(t.getHours())}:${p2(t.getMinutes())}` }] }));
    setCat({}); setTr([]); setDr([]); setDrSite([]); setEx([]); setNote(''); setMsg('의뢰가 저장되었습니다');
  };
  const chk = (a: string[], set: (v: string[]) => void, items: string[], cls: string) => items.map(x => <label key={x} className={cls}><input type="checkbox" checked={a.includes(x)} onChange={() => tg(a, set, x)} />{x}</label>);
  return (
    <div className="rw" style={{ overflow: 'auto' }}>
      <style>{CSS}</style>
      <div className="rw-q">
        <label><b>환자번호</b><input type="text" value={i.ptNo || ''} readOnly style={{ width: 90 }} /><input type="text" value={i.name || ''} readOnly style={{ width: 70 }} /></label>
        <label><b>성별/나이</b><input type="text" value={i.ageSex || ''} readOnly style={{ width: 80 }} /></label>
        <label><b>병동/병실</b><input type="text" value={[i.ward, i.bed].filter(Boolean).join('/')} readOnly style={{ width: 110 }} /></label>
        <label><b>진료과</b><input type="text" value={i.dept || ''} readOnly style={{ width: 90 }} /></label>
        <label><b>시행일자</b><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      </div>
      <div className="box" style={{ justifyContent: 'center', gap: 28, fontWeight: 700 }}>
        <label><input type="checkbox" checked={!!cat.consent} onChange={e => setCat(c => ({ ...c, consent: e.target.checked }))} />동의서</label>
        <label className="l1"><input type="checkbox" checked={tr.length > 0} readOnly />치료술기</label>
        <label className="l2"><input type="checkbox" checked={!!cat.dress || dr.length > 0} onChange={e => setCat(c => ({ ...c, dress: e.target.checked }))} />드레싱</label>
        <label className="l3"><input type="checkbox" checked={ex.length > 0} readOnly />검사</label>
      </div>
      <div className="box"><h5 className="l1">치료술기</h5>{chk(tr, setTr, TREAT, 'l1')}</div>
      <div className="box"><h5 className="l2">드레싱</h5>
        <label className="l2"><input type="checkbox" checked={dr.includes('단순 드레싱')} onChange={() => tg(dr, setDr, '단순 드레싱')} />단순 드레싱</label>
        <label className="l2"><input type="checkbox" checked={dr.includes('복합 드레싱')} onChange={() => tg(dr, setDr, '복합 드레싱')} />복합 드레싱</label>
        <span style={{ flex: '0 0 100%' }} className="l2">부위 {DRESS.map(x => <label key={x} style={{ marginRight: 8 }}><input type="checkbox" checked={drSite.includes(x)} onChange={() => tg(drSite, setDrSite, x)} />{x}</label>)}</span>
      </div>
      <div className="box"><h5 className="l3">검사</h5>
        {chk(ex, setEx, EXAMS, 'l3')}
        <span style={{ flex: '0 0 100%' }} className="l3">금지부위 <label><input type="radio" name="cr-b" checked={ban === 'none'} onChange={() => setBan('none')} />없음</label> <label><input type="radio" name="cr-b" checked={ban === 'has'} onChange={() => setBan('has')} />있음 ( {['Lt상지', 'Rt상지', 'Lt하지', 'Rt하지'].map(x => <label key={x} style={{ marginRight: 6 }}><input type="checkbox" disabled={ban !== 'has'} checked={banSite.includes(x)} onChange={() => tg(banSite, setBanSite, x)} />{x}</label>)})</label></span>
      </div>
      <label style={{ alignItems: 'flex-start' }}><b style={{ minWidth: 60 }}>전달사항</b><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} /></label>
      <div className="rw-q">
        <b>시행시간</b>
        {['미지정', 'D', 'E', '응급', '시간지정'].map(x => <label key={x}><input type="radio" name="cr-w" checked={when === x} onChange={() => setWhen(x)} />{x}{x === '시간지정' && <input type="time" value={tm} disabled={when !== '시간지정'} onChange={e => setTm(e.target.value)} />}</label>)}
        <label style={{ marginLeft: 'auto' }}><b>의뢰자</b><input type="text" value={userName} readOnly style={{ width: 80 }} /></label>
        <button type="button" className="p" onClick={save}>저장</button>
      </div>
      {reqs.length > 0 && (
        <div className="sc" style={{ flex: '0 0 auto', maxHeight: 150 }}>
          <table>
            <thead><tr><th>시행일</th><th>의뢰내용</th><th>전달사항</th><th>시행시간</th><th>의뢰자</th><th /></tr></thead>
            <tbody>{reqs.map((r, k) => <tr key={k}><td className="c">{r.date}</td><td>{r.text}</td><td>{r.note}</td><td className="c">{r.when}</td><td className="c">{r.author}</td><td className="c"><button type="button" onClick={() => setData(d => ({ ...d, memos: d.memos.filter(x => x !== r) }))}>삭제</button></td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="bar">{msg && <span className="msg">{msg}</span>}<button type="button" onClick={onMat}>처치/재료 &gt;</button><button type="button" onClick={onClose}>종료</button></div>
    </div>
  );
}

// ─── 퇴원후 건강계획 ───
const DP_SEL: Record<string, string[]> = {
  dp_aware: ['명료(Alert)', '기면(Drowsy)', '혼미(Stupor)', '혼수(Coma)'],
  dp_how: ['도보', '휠체어', '침대(카트)'],
  dp_vehicle: ['자가용', '구급차', '택시', '대중교통'],
  dp_edu: ['환자', '보호자', '환자+보호자'],
  dp_guard: ['배우자', '자녀', '부모', '형제', '기타'],
  dp_follow: ['외래 추후관리', '가정간호', '요양병원 전원', '관리 불필요'],
  dp_type: ['정상퇴원', '자의퇴원', '전원', '사망', '탈원'],
  dp_home: ['자택', '요양병원', '요양원', '기타'],
};
const DP_LBL: Record<string, string> = { dp_aware: '의식상태', dp_how: '이송방법', dp_vehicle: '이송수단', dp_edu: '교육대상', dp_guard: '퇴원후주보호자', dp_follow: '추후관리', dp_type: '퇴원형태', dp_home: '퇴원 후 거주장소 확인' };
const DP_REQ = ['dp_aware', 'dp_how', 'dp_vehicle', 'dp_edu', 'dp_guard', 'dp_follow', 'dp_type', 'dp_home'];
const EQUIP = ['모니터', '산소스프레이', '산소탱크', '산소발생기', 'Gavage tube', 'GI Stomy', 'Tracheostomy', 'home vent', '흡인기'];
export function DcPlan({ data, setData, userName, onClose }: { data: ChartData; setData: SD; userName: string; onClose: () => void }) {
  const i = data.info;
  const [tab, setTab] = useState<'plan' | 'meds'>('plan');
  const [mode, setMode] = useState<'plan' | 'done'>('plan');
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setData(d => ({ ...d, info: { ...d.info, [k]: v } }));
  const v = (k: string) => i[k] || '';
  const eq = v('dp_equip').split(',').filter(Boolean);
  const miss = DP_REQ.filter(k => !v(k));
  const save = () => {
    if (miss.length) { setMsg(`필수 항목 입력 필요: ${DP_LBL[miss[0]]}${miss.length > 1 ? ` 외 ${miss.length - 1}건` : ''}`); return; }
    const t = vnow();
    set('dp_saved', `${ymd(t)} ${p2(t.getHours())}:${p2(t.getMinutes())} ${userName}`);
    setMsg('저장되었습니다');
  };
  const del = () => { setData(d => ({ ...d, info: Object.fromEntries(Object.entries(d.info).filter(([k]) => !k.startsWith('dp_'))) as typeof d.info })); setMsg('삭제되었습니다'); };
  const sel = (k: string) => (
    <label><span className={DP_REQ.includes(k) ? 'l3' : ''}>{DP_REQ.includes(k) ? '* ' : ''}{DP_LBL[k]}</span>
      <select className={!v(k) && DP_REQ.includes(k) ? 'req' : ''} value={v(k)} onChange={e => set(k, e.target.value)}><option value="" />{DP_SEL[k].map(o => <option key={o}>{o}</option>)}</select></label>
  );
  const ta = (k: string, label: string, rows: number, req?: boolean) => (
    <div><b>{label}</b><textarea rows={rows} className={req && !v(k) ? 'req' : ''} value={v(k)} onChange={e => set(k, e.target.value)} /></div>
  );
  return (
    <div className="rw" style={{ overflow: 'auto' }}>
      <style>{CSS}</style>
      <div className="rw-q">
        <label><input type="radio" name="dp-m" checked={mode === 'plan'} onChange={() => setMode('plan')} />퇴원예정</label>
        <label><input type="radio" name="dp-m" checked={mode === 'done'} onChange={() => setMode('done')} />퇴원</label>
        <label><b className="l3">* 부서</b><input type="text" className="req" value={i.ward || ''} readOnly style={{ width: 140 }} /></label>
        <label><b>퇴원(퇴실)일자</b><input type="date" value={(i.disDate || '').slice(0, 10) || ymd(vnow())} readOnly /></label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 8, flex: 1, minHeight: 0 }}>
        <div className="sc">
          <table>
            <thead><tr><th>순번</th><th>환자번호</th><th>환자명</th><th>입원일자</th><th>성별</th></tr></thead>
            <tbody><tr style={{ background: '#dbe7f7' }}><td className="c">1</td><td>{i.ptNo}</td><td>{i.name}</td><td>{(i.admit || '').slice(0, 10)}</td><td className="c">{(i.ageSex || '').split('/')[1]?.trim()?.[0] || ''}</td></tr></tbody>
          </table>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'auto' }}>
          <div className="dr-tb" style={{ display: 'flex', gap: 2 }}>
            <button type="button" className={tab === 'plan' ? 'p' : ''} onClick={() => setTab('plan')}>퇴원정보/계획</button>
            <button type="button" className={tab === 'meds' ? 'p' : ''} onClick={() => setTab('meds')}>투약(퇴원약)/검사/예약</button>
          </div>
          {tab === 'plan' ? (
            <>
              <div className="rw-q"><b>퇴원상태</b><label><input type="checkbox" checked={v('dp_dead') === 'Y'} onChange={e => set('dp_dead', e.target.checked ? 'Y' : '')} />사망환자</label><label><input type="checkbox" checked={v('dp_tel') !== 'N'} onChange={e => set('dp_tel', e.target.checked ? 'Y' : 'N')} />전화방문 여부</label></div>
              <div className="rw-q">{sel('dp_aware')}{sel('dp_how')}{sel('dp_vehicle')}{sel('dp_edu')}{sel('dp_guard')}</div>
              <div className="rw-q">
                <label><b>환자상태</b><input type="text" value={v('dp_state')} onChange={e => set('dp_state', e.target.value)} style={{ width: 140 }} /></label>
                {sel('dp_follow')}
                <label><b className="l3">* 가정간호 필요여부</b><span className={!v('dp_hhc') ? 'req' : ''} style={{ border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4 }}><label><input type="radio" name="dp-h" checked={v('dp_hhc') === '유'} onChange={() => set('dp_hhc', '유')} />유</label> <label><input type="radio" name="dp-h" checked={v('dp_hhc') === '무'} onChange={() => set('dp_hhc', '무')} />무</label></span></label>
                <label><b>요구도 사정</b><label><input type="radio" name="dp-n" checked={v('dp_need') === '유'} onChange={() => set('dp_need', '유')} />유</label><label><input type="radio" name="dp-n" checked={v('dp_need') === '무'} onChange={() => set('dp_need', '무')} />무</label></label>
              </div>
              <div className="rw-q">{sel('dp_type')}{sel('dp_home')}</div>
              <div className="rw-q"><b>활력징후</b>
                {[['dp_bp', 'BP', 'mmHg'], ['dp_pr', 'PR', '회/분'], ['dp_rr', 'RR', '회/분'], ['dp_bt', 'BT', '℃']].map(([k, l, u]) => <label key={k}>{l}<input type="text" value={v(k)} onChange={e => set(k, e.target.value)} style={{ width: 70 }} />{u}</label>)}
                <button type="button" onClick={() => { const r = [...data.vitals].filter(x => x.time).sort((a, b) => (a.time || '').localeCompare(b.time || '')).slice(-1)[0]; if (r) { set('dp_bp', r.bp || ''); set('dp_pr', r.hr || ''); set('dp_rr', r.rr || ''); set('dp_bt', r.bt || ''); } }}>최근 V/S 가져오기</button>
              </div>
              <div className="rw-q"><b>특수장비</b>{EQUIP.map(x => <label key={x}><input type="checkbox" checked={eq.includes(x)} onChange={() => set('dp_equip', (eq.includes(x) ? eq.filter(y => y !== x) : [...eq, x]).join(','))} />{x}</label>)}</div>
              <div className="rw-q"><b className="l1">퇴원간호계획</b><label><input type="radio" name="dp-l" checked={v('dp_lang') !== 'en'} onChange={() => set('dp_lang', 'ko')} />한글</label><label><input type="radio" name="dp-l" checked={v('dp_lang') === 'en'} onChange={() => set('dp_lang', 'en')} />영문</label></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{ta('dp_care', '퇴원 후 건강관리', 5, true)}{ta('dp_ask', '퇴원 후 문의가 필요한 사항', 4, true)}{ta('dp_er', '응급실 방문 사항', 3)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{ta('dp_sum', '간호 경과 요약', 5)}{ta('dp_etc', '기타 안내 사항', 4)}{ta('dp_items', '퇴원시 준비물품', 3)}</div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <b>퇴원약</b>
              <table><thead><tr><th>약품명</th><th>용량</th><th>용법</th><th>일수</th><th>확인</th></tr></thead><tbody>
                {data.dcmed.map((m, k) => <tr key={k}><td>{m.name}</td><td className="c">{m.dose}</td><td className="c">{m.route || m.freq}</td><td className="c">{m.days}</td><td className="c">{m.st}</td></tr>)}
                {data.dcmed.length === 0 && <tr><td colSpan={5} className="none">No data to display</td></tr>}
              </tbody></table>
              <b>외래 예약</b>
              <table><thead><tr><th>예약일시</th><th>진료과</th><th>진료의</th><th>비고</th></tr></thead><tbody>
                {data.appts.filter(a => a.st !== '취소').map((a, k) => <tr key={k}><td className="c">{a.date} {a.time}</td><td className="c">{a.dept}</td><td className="c">{a.doc}</td><td>{a.purpose}</td></tr>)}
                {data.appts.length === 0 && <tr><td colSpan={4} className="none">No data to display</td></tr>}
              </tbody></table>
            </div>
          )}
        </div>
      </div>
      <div className="bar">
        {(msg || v('dp_saved')) && <span className="msg" style={msg.startsWith('필수') ? { color: '#b45309' } : undefined}>{msg || `최종 저장 ${v('dp_saved')}`}</span>}
        <button type="button" className="p" onClick={save}>저장</button>
        <button type="button" onClick={del}>삭제</button>
        <button type="button" onClick={onClose}>종료</button>
      </div>
    </div>
  );
}

// ─── 용법코드 조회 ───
export function UsageWin({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState(0);
  const rows = USAGE.filter(u => (!kind || u.kind === kind) && (!q.trim() || u.code.toLowerCase().includes(q.trim().toLowerCase()) || u.text.includes(q.trim())));
  return (
    <div className="rw">
      <style>{CSS}</style>
      <div className="rw-q">
        <b>적용구분</b>
        {[[0, '전체'], [1, '내복약'], [2, '주사약'], [3, '외용제']].map(([k, l]) => <label key={k}><input type="radio" name="us-k" checked={kind === k} onChange={() => setKind(k as number)} />{l}</label>)}
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="코드 또는 용법 검색 (예: 3P, 식후)" aria-label="용법코드 검색" style={{ width: 260 }} />
        <span style={{ marginLeft: 'auto', color: 'var(--sub-text)' }}>{rows.length} / {USAGE.length}건 · 2026.03.10 기준</span>
      </div>
      <div className="sc">
        <table>
          <thead><tr><th>번호</th><th>코드</th><th>적용구분</th><th>횟수</th><th>용법</th></tr></thead>
          <tbody>
            {rows.map((u, k) => <tr key={u.code}><td className="c">{k + 1}</td><td className="c"><b>{u.code}</b></td><td className="c">{KIND_LABEL[u.kind]}</td><td className="c">{u.times || '-'}</td><td>{u.text}</td></tr>)}
            {rows.length === 0 && <tr><td colSpan={5} className="none">No data to display</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="bar"><button type="button" onClick={onClose}>종료</button></div>
    </div>
  );
}
