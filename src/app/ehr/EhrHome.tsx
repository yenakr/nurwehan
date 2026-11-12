'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SAMPLES, WARDS, bedLabel } from './samples';
import { emptyChart } from './types';

type Item = {
  id: string; ward: string | null; bed: string | null; sampleKey: string | null;
  ptNo: string | null; name: string | null; ageSex: string | null; dx: string | null; doctor: string | null; admit: string | null;
};

const stay = (admit: string | null) => {
  if (!admit) return '';
  const d = new Date(admit);
  if (isNaN(d.getTime())) return '';
  const n = Math.floor((Date.now() - d.getTime()) / 86400000) + 1;
  return n > 0 ? `${n}일째` : '';
};

export default function EhrHome({ cases }: { cases: Item[] }) {
  const router = useRouter();
  const [wardIdx, setWardIdx] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const ward = WARDS[wardIdx];

  const open = async (key: string, existing: Item | undefined, make: () => { title: string; subject: string | null; data: unknown }) => {
    if (busy) return;
    if (existing) {
      router.push(`/ehr/${existing.id}`);
      return;
    }
    setBusy(key);
    setErr('');
    try {
      const body = make();
      const res = await fetch('/api/ehr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.id) throw new Error();
      router.push(`/ehr/${j.id}`);
    } catch {
      setErr('불러오지 못했어요. 저장 테이블이 준비됐는지 확인해 주세요.');
      setBusy(null);
    }
  };

  const rows = Array.from({ length: ward.beds }, (_, k) => {
    const bed = bedLabel(ward, k + 1);
    const sample = SAMPLES.find(s => s.data.info.ward === ward.name && s.data.info.bed === bed);
    const saved = cases.find(c => c.ward === ward.name && c.bed === bed);
    return { bed, sample, saved };
  });

  return (
    <div className="ehrWard">
      <div className="shell">
        <div className="top">
          <span className="logo">병동부</span>
          <nav role="tablist">
            {WARDS.map((w, i) => (
              <button key={w.name} type="button" role="tab" aria-selected={i === wardIdx} className={i === wardIdx ? 'on' : ''} onClick={() => setWardIdx(i)}>
                {w.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>병상</th><th>환자번호</th><th>이름</th><th>나이/성별</th><th className="dx">진단명</th><th>주치의</th><th>입원일</th><th>재원</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ bed, sample, saved }) => {
                const p = saved
                  ? { ptNo: saved.ptNo, name: saved.name, ageSex: saved.ageSex, dx: saved.dx, doctor: saved.doctor, admit: saved.admit }
                  : sample
                    ? sample.data.info
                    : null;
                const key = `${ward.name}:${bed}`;
                if (!p) {
                  return (
                    <tr key={bed} className="empty" onClick={() => open(key, undefined, () => ({
                      title: '새 환자', subject: ward.name,
                      data: { ...emptyChart(), info: { ward: ward.name, bed, admit: new Date().toISOString().slice(0, 10) } },
                    }))}>
                      <td className="bed">{bed}</td>
                      <td colSpan={7}>{busy === key ? '여는 중…' : '빈 병상 · 눌러서 새 환자 차트 만들기'}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={bed} onClick={() => open(key, saved, () => ({ title: sample!.title, subject: sample!.subject, data: sample!.data }))}>
                    <td className="bed">{bed}</td>
                    <td>{p.ptNo}</td>
                    <td className="nm">{busy === key ? '여는 중…' : p.name}</td>
                    <td>{p.ageSex}</td>
                    <td className="dx">{p.dx}</td>
                    <td>{p.doctor}</td>
                    <td>{p.admit}</td>
                    <td>{stay(p.admit || null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {err && <p className="err">{err}</p>}

      <style jsx global>{`
        .ehrWard .shell { border: 1px solid #94a3b8; background: #fff; border-radius: 4px; overflow: hidden; font-size: 13px; color: #1f2937; }
        .ehrWard .top { display: flex; align-items: stretch; background: linear-gradient(#233a5c, #17283f); }
        .ehrWard .logo { flex: 0 0 auto; display: flex; align-items: center; padding: 0 18px; color: #e8c97a; font-weight: 800; letter-spacing: 1px; border-right: 1px solid rgba(255,255,255,0.15); }
        .ehrWard .top nav { display: flex; overflow-x: auto; }
        .ehrWard .top nav button { flex: 0 0 auto; border: 0; background: transparent; color: #e5ebf3; padding: 12px 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.08); }
        .ehrWard .top nav button.on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }
        .ehrWard .tw { overflow-x: auto; }
        .ehrWard table { width: 100%; border-collapse: collapse; }
        .ehrWard th { background: #e9edf1; border: 1px solid #cfd5dc; padding: 7px 8px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .ehrWard td { border: 1px solid #e1e5ea; padding: 9px 8px; white-space: nowrap; }
        .ehrWard td.dx { white-space: normal; min-width: 200px; }
        .ehrWard tbody tr { cursor: pointer; }
        .ehrWard tbody tr:hover { background: #eef6ff; }
        .ehrWard td.bed { background: #f6f7f9; font-weight: 700; color: #334155; width: 86px; }
        .ehrWard td.nm { font-weight: 800; color: #0e4a84; }
        .ehrWard tr.empty td { color: #94a3b8; }
        .ehrWard tr.empty td.bed { color: #94a3b8; }
        .ehrWard .err { color: #b91c1c; font-size: 0.8125rem; margin-top: 10px; }
      `}</style>
    </div>
  );
}
