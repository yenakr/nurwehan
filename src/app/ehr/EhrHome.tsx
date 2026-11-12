'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SAMPLES, WARDS, bedLabel, roomNo } from './samples';
import { emptyChart, migrate } from './types';

type Item = {
  id: string; ward: string | null; bed: string | null; sampleKey: string | null;
  ptNo: string | null; name: string | null; ageSex: string | null; dx: string | null; doctor: string | null; admit: string | null;
  dept: string | null; visitTime: string | null; vstatus: string | null; ktas: string | null; zone: string | null; cc: string | null;
};
type P = Partial<Omit<Item, 'id'>>;

const stay = (admit: string | null | undefined) => {
  if (!admit) return '';
  const d = new Date(admit);
  if (isNaN(d.getTime())) return '';
  const n = Math.floor((Date.now() - d.getTime()) / 86400000) + 1;
  return n > 0 ? `${n}일째` : '';
};
const today = () => new Date().toISOString().slice(0, 10);
const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type View = { kind: 'ward' | 'op' | 'er'; name: string; group: string | null };
const VIEWS: View[] = [
  ...WARDS.map(w => ({ kind: 'ward' as const, name: w.name, group: w.group })),
  { kind: 'op', name: '외래', group: null },
  { kind: 'er', name: '응급', group: null },
];
// 상단 탭: 내과 ▾ / 외과 ▾ 는 묶음, 나머지는 단독
const TOP: { label: string; idx: number[] }[] = (() => {
  const out: { label: string; idx: number[] }[] = [];
  VIEWS.forEach((v, i) => {
    const label = v.group || v.name;
    const g = out.find(o => o.label === label);
    if (g) g.idx.push(i);
    else out.push({ label, idx: [i] });
  });
  return out;
})();

export default function EhrHome({ cases }: { cases: Item[] }) {
  const router = useRouter();
  const [vi, setVi] = useState(0);
  const [openG, setOpenG] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const view = VIEWS[vi];
  const wardName = view.kind === 'op' ? '외래' : view.kind === 'er' ? '응급실' : view.name;

  const open = async (key: string, existing: Item | undefined, make: () => { title: string; subject: string | null; data: unknown }) => {
    if (busy) return;
    if (existing) {
      router.push(`/ehr/${existing.id}`);
      return;
    }
    setBusy(key);
    setErr('');
    try {
      const res = await fetch('/api/ehr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(make()) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.id) throw new Error();
      router.push(`/ehr/${j.id}`);
    } catch {
      setErr('열 수 없어요');
      setBusy(null);
    }
  };

  // 병동: 병상 단위 / 외래·응급: 샘플 + 직접 추가한 환자
  type Entry = { key: string; label: string; room?: { no: number; size: number; first: boolean }; p: P | null; saved?: Item; make: () => { title: string; subject: string | null; data: unknown } };
  let entries: Entry[] = [];
  if (view.kind === 'ward') {
    const w = WARDS.find(x => x.name === view.name)!;
    w.rooms.forEach((size, ri) => {
      for (let b = 1; b <= size; b++) {
        const bed = bedLabel(w, ri + 1, b);
        const sample = SAMPLES.find(sp => sp.data.info.ward === w.name && sp.data.info.bed === bed);
        const saved = sample ? cases.find(c => c.sampleKey === sample.key) : cases.find(c => c.ward === w.name && c.bed === bed);
        entries.push({
          key: `${w.name}:${bed}`,
          label: bed,
          room: { no: roomNo(w, ri + 1), size, first: b === 1 },
          saved,
          p: saved ?? (sample ? sample.data.info : null),
          make: () => sample
            ? { title: sample.title, subject: sample.subject, data: migrate(sample.data) }
            : { title: '새 환자', subject: w.name, data: { ...emptyChart(), info: { ward: w.name, bed, admit: today() } } },
        });
      }
    });
  } else {
    const samples = SAMPLES.filter(s => s.data.info.ward === wardName);
    const savedHere = cases.filter(c => c.ward === wardName);
    const used = new Set<string>();
    samples.forEach(s => {
      const saved = savedHere.find(c => c.sampleKey === s.key);
      if (saved) used.add(saved.id);
      entries.push({ key: s.key, label: '', saved, p: saved ?? s.data.info, make: () => ({ title: s.title, subject: s.subject, data: migrate(s.data) }) });
    });
    savedHere.filter(c => !used.has(c.id)).forEach(c => entries.push({ key: c.id, label: '', saved: c, p: c, make: () => ({ title: '', subject: null, data: {} }) }));
    entries.sort((a, b) => (a.p?.visitTime || '').localeCompare(b.p?.visitTime || ''));
  }

  const newPatient = () => open(`new:${wardName}`, undefined, () => ({
    title: '새 환자',
    subject: view.name,
    data: { ...emptyChart(), info: { ward: wardName, admit: today(), visitTime: nowHM(), vstatus: view.kind === 'er' ? '대기' : '접수', ...(view.kind === 'er' ? { ktas: '3', zone: '응급', dept: 'ER' } : {}) } },
  }));

  return (
    <div className="ehrWard">
      <div className="shell">
        <div className="top">
          <span className="logo">병동뷰</span>
          <nav role="tablist">
            {TOP.map(t => {
              const active = t.idx.includes(vi);
              const multi = t.idx.length > 1;
              const special = VIEWS[t.idx[0]].kind !== 'ward';
              return (
                <div key={t.label} className="mi">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`${active ? 'on' : ''} ${special ? 'sp' : ''}`}
                    onClick={() => {
                      if (multi) setOpenG(openG === t.label ? null : t.label);
                      else { setVi(t.idx[0]); setOpenG(null); }
                    }}
                  >
                    {multi && active ? `${view.name} ${WARDS.find(w => w.name === view.name)?.dept}` : t.label}{multi ? ' ▾' : ''}
                  </button>
                  {multi && openG === t.label && (
                    <div className="dd">
                      {t.idx.map(i => (
                        <button key={i} type="button" className={vi === i ? 'on' : ''} onClick={() => { setVi(i); setOpenG(null); }}>{VIEWS[i].name} {WARDS.find(w => w.name === VIEWS[i].name)?.dept}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="tw">
          <table>
            <thead>
              {view.kind === 'ward' && <tr><th>병실</th><th>병상</th><th>환자번호</th><th>이름</th><th>나이/성별</th><th>진료과</th><th className="dx">진단명</th><th>주치의</th><th>입원일</th><th>재원</th></tr>}
              {view.kind === 'op' && <tr><th>예약시간</th><th>환자번호</th><th>이름</th><th>나이/성별</th><th>진료과</th><th>주치의</th><th className="dx">내원사유</th><th>상태</th></tr>}
              {view.kind === 'er' && <tr><th>도착</th><th>KTAS</th><th>이름</th><th>나이/성별</th><th className="dx">주호소</th><th>구역</th><th>담당의</th><th>상태</th></tr>}
            </thead>
            <tbody>
              {entries.map(e => {
                const p = e.p;
                const roomCell = e.room?.first ? (
                  <td className="room" rowSpan={e.room.size}>
                    <b>{e.room.no}</b>
                    <span>{e.room.size}인실</span>
                  </td>
                ) : null;
                if (!p) {
                  return (
                    <tr key={e.key} className="empty" onClick={() => open(e.key, undefined, e.make)}>
                      {roomCell}
                      <td className="bed">{e.label}</td>
                      <td colSpan={8} className="plus">{busy === e.key ? '…' : '+'}</td>
                    </tr>
                  );
                }
                const nm = busy === e.key ? '…' : p.name;
                return (
                  <tr key={e.key} onClick={() => open(e.key, e.saved, e.make)}>
                    {view.kind === 'ward' && (
                      <>
                        {roomCell}
                        <td className="bed">{e.label}</td><td>{p.ptNo}</td><td className="nm">{nm}</td><td>{p.ageSex}</td><td>{p.dept}</td>
                        <td className="dx">{p.dx}</td><td>{p.doctor}</td><td>{p.admit}</td><td>{stay(p.admit)}</td>
                      </>
                    )}
                    {view.kind === 'op' && (
                      <>
                        <td className="bed">{p.visitTime}</td><td>{p.ptNo}</td><td className="nm">{nm}</td><td>{p.ageSex}</td>
                        <td>{p.dept}</td><td>{p.doctor}</td><td className="dx">{p.cc}</td><td><span className="stt">{p.vstatus}</span></td>
                      </>
                    )}
                    {view.kind === 'er' && (
                      <>
                        <td className="bed">{p.visitTime}</td><td><span className={`kt k${p.ktas}`}>{p.ktas}</span></td><td className="nm">{nm}</td><td>{p.ageSex}</td>
                        <td className="dx">{p.cc}</td><td>{p.zone}</td><td>{p.doctor}</td><td><span className="stt">{p.vstatus}</span></td>
                      </>
                    )}
                  </tr>
                );
              })}
              {view.kind !== 'ward' && (
                <tr className="empty" onClick={newPatient}>
                  <td colSpan={8} className="plus">{busy === `new:${wardName}` ? '…' : '+'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {err && <p className="err">{err}</p>}

      <style jsx global>{`
        .ehrWard .shell { border: 1px solid #94a3b8; background: #fff; border-radius: 4px; overflow: hidden; font-size: 13px; color: #1f2937; }
        .ehrWard .top { display: flex; align-items: stretch; background: linear-gradient(#233a5c, #17283f); }
        .ehrWard .logo { flex: 0 0 auto; display: flex; align-items: center; padding: 0 18px; color: #e8c97a; font-weight: 800; letter-spacing: 1px; border-right: 1px solid rgba(255,255,255,0.15); }
        .ehrWard .top nav { display: flex; flex-wrap: wrap; }
        .ehrWard .mi { position: relative; }
        .ehrWard .top nav .mi > button { flex: 0 0 auto; border: 0; background: transparent; color: #e5ebf3; padding: 12px 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.08); }
        .ehrWard .dd { position: absolute; top: 100%; left: 0; z-index: 20; min-width: 130px; background: #fff; border: 1px solid #94a3b8; box-shadow: 0 6px 16px rgba(15,23,42,0.18); display: flex; flex-direction: column; }
        .ehrWard .dd button { border: 0; background: #fff; text-align: left; padding: 9px 14px; font-size: 13px; font-family: inherit; color: #1f2937; cursor: pointer; white-space: nowrap; }
        .ehrWard .dd button:hover { background: #eef6ff; }
        .ehrWard .dd button.on { color: #0e4a84; font-weight: 800; }
        .ehrWard .top nav .mi > button.sp { color: #f5d98b; }
        .ehrWard .top nav .mi > button.on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }
        .ehrWard .tw { overflow-x: auto; }
        .ehrWard table { width: 100%; border-collapse: collapse; }
        .ehrWard th { background: #e9edf1; border: 1px solid #cfd5dc; padding: 7px 8px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .ehrWard td { border: 1px solid #e1e5ea; padding: 8px; white-space: nowrap; }
        .ehrWard td.dx { white-space: normal; min-width: 200px; }
        .ehrWard tbody tr { cursor: pointer; }
        .ehrWard tbody tr:hover { background: #eef6ff; }
        .ehrWard td.room { text-align: center; vertical-align: middle; background: #eef1f5; width: 84px; border-right: 2px solid #cfd5dc; }
        .ehrWard td.room b { display: block; font-size: 15px; color: #1e293b; }
        .ehrWard td.room span { font-size: 11.5px; color: #64748b; }
        .ehrWard td.plus { color: #cbd5e1; font-size: 16px; padding: 6px 8px; }
        .ehrWard tr.empty:hover td.plus { color: #1d4e89; }
        .ehrWard td.bed { background: #f6f7f9; font-weight: 700; color: #334155; width: 70px; }
        .ehrWard td.nm { font-weight: 800; color: #0e4a84; }
        .ehrWard tr.empty td { color: #94a3b8; }
        .ehrWard .stt { background: #e8f0fb; color: #1d4e89; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 700; }
        .ehrWard .kt { display: inline-block; min-width: 22px; text-align: center; border-radius: 4px; padding: 1px 6px; font-weight: 800; color: #fff; background: #94a3b8; }
        .ehrWard .k1 { background: #dc2626; } .ehrWard .k2 { background: #ea580c; } .ehrWard .k3 { background: #ca8a04; }
        .ehrWard .k4 { background: #16a34a; } .ehrWard .k5 { background: #64748b; }
        .ehrWard .err { color: #b91c1c; font-size: 0.8125rem; margin-top: 10px; }
      `}</style>
    </div>
  );
}
