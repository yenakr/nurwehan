'use client';

// 외래·응급 차트 상단 패널: 접수/도착, 상태, KTAS, 구역, 주호소
const KTAS: { v: string; c: string; t: string }[] = [
  { v: '1', c: '#dc2626', t: '소생' },
  { v: '2', c: '#ea580c', t: '긴급' },
  { v: '3', c: '#ca8a04', t: '응급' },
  { v: '4', c: '#16a34a', t: '준응급' },
  { v: '5', c: '#2563eb', t: '비응급' },
];
const OP_STATUS = ['접수', '대기', '진료중', '완료'];
const ER_STATUS = ['대기', '진료중', '검사중', '관찰', '입원', '귀가'];
const ZONES = ['응급', '소아', '관찰', '중환자'];

export default function VisitStrip({ info, set }: { info: Record<string, string>; set: (k: string, v: string) => void }) {
  const er = info.ward === '응급실';
  const status = er ? ER_STATUS : OP_STATUS;
  return (
    <div className="vs">
      <style>{`
        .vs { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: flex-end; }
        .vs .g { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .vs em { font-style: normal; font-size: 11.5px; color: var(--sub-text); }
        .vs .ch { display: flex; flex-wrap: wrap; gap: 5px; }
        .vs .ch button { border: 1px solid var(--border); background: transparent; color: inherit; border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 13px; cursor: pointer; }
        .vs .ch button.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        .vs .ch.k button { width: 34px; padding: 5px 0; border-radius: 8px; font-weight: 800; }
        .vs input, .vs select { border: 1px solid var(--border); border-radius: 8px; padding: 6px 9px; font: inherit; font-size: 13.5px; background: transparent; color: var(--text, inherit); min-width: 0; }
        .vs .cc { flex: 1 1 220px; }
        .vs .cc input { width: 100%; box-sizing: border-box; }
      `}</style>
      <label className="g"><em>{er ? '도착' : '접수'}</em><input type="time" value={info.visitTime || ''} onChange={e => set('visitTime', e.target.value)} /></label>
      {er && (
        <div className="g">
          <em>KTAS</em>
          <div className="ch k">
            {KTAS.map(k => (
              <button key={k.v} type="button" title={k.t} className={info.ktas === k.v ? 'on' : ''} style={info.ktas === k.v ? { background: k.c, borderColor: k.c } : undefined} onClick={() => set('ktas', k.v)}>{k.v}</button>
            ))}
          </div>
        </div>
      )}
      {er && (
        <label className="g"><em>구역</em>
          <select value={info.zone || ''} onChange={e => set('zone', e.target.value)}>
            <option value="" />{ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
      )}
      <div className="g">
        <em>상태</em>
        <div className="ch">{status.map(s => <button key={s} type="button" className={info.vstatus === s ? 'on' : ''} onClick={() => set('vstatus', s)}>{s}</button>)}</div>
      </div>
      <label className="g cc"><em>{er ? '주호소' : '내원사유'}</em><input value={info.cc || ''} onChange={e => set('cc', e.target.value)} /></label>
    </div>
  );
}
