'use client';

import { useState } from 'react';

type Tab = 'drip' | 'dose' | 'weight' | 'bmi';

const TABS: { id: Tab; label: string }[] = [
  { id: 'drip', label: '수액' },
  { id: 'dose', label: '약물' },
  { id: 'weight', label: '체중당' },
  { id: 'bmi', label: 'BMI' },
];

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
};
const fmt = (n: number, d = 1) => (Number.isFinite(n) ? String(Math.round(n * 10 ** d) / 10 ** d) : '-');

function Field({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="f">
      <span>{label}</span>
      <div className="in">
        <input inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder="0" />
        <em>{unit}</em>
      </div>
      <style jsx>{`
        .f { display: flex; flex-direction: column; gap: 6px; }
        .f span { font-size: 0.8125rem; font-weight: 700; color: var(--sub-text); }
        .in { display: flex; align-items: center; border: 1px solid var(--border); border-radius: 10px; background: var(--background); padding: 0 12px; }
        .in:focus-within { border-color: var(--primary); }
        input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; padding: 12px 0; font-size: 1.0625rem; font-weight: 700; color: var(--text); }
        em { font-style: normal; font-size: 0.875rem; color: #94a3b8; }
      `}</style>
    </label>
  );
}

function Result({ rows }: { rows: { label: string; value: string; unit: string; main?: boolean }[] }) {
  return (
    <div className="res">
      {rows.map(r => (
        <div key={r.label} className={r.main ? 'r main' : 'r'}>
          <span>{r.label}</span>
          <b>{r.value}<i>{r.unit}</i></b>
        </div>
      ))}
      <style jsx>{`
        .res { background: var(--primary); color: #fff; border-radius: 14px; padding: 6px 16px; }
        .r { display: flex; align-items: baseline; justify-content: space-between; padding: 11px 0; border-top: 1px solid rgba(255,255,255,0.18); }
        .r:first-child { border-top: none; }
        .r span { font-size: 0.875rem; opacity: 0.85; }
        .r b { font-size: 1.125rem; font-weight: 800; }
        .r.main b { font-size: 1.75rem; }
        .r i { font-style: normal; font-size: 0.875rem; font-weight: 600; margin-left: 4px; opacity: 0.85; }
      `}</style>
    </div>
  );
}

export default function Calculator() {
  const [tab, setTab] = useState<Tab>('drip');

  // 수액
  const [vol, setVol] = useState('');
  const [hours, setHours] = useState('');
  const [factor, setFactor] = useState(20);
  // 약물
  const [order, setOrder] = useState('');
  const [conc, setConc] = useState('');
  // 체중당
  const [perKg, setPerKg] = useState('');
  const [kg, setKg] = useState('');
  // BMI
  const [cm, setCm] = useState('');
  const [bw, setBw] = useState('');

  const v = num(vol), h = num(hours);
  const mlhr = v / h;
  const gtt = (v * factor) / (h * 60);

  const ml = num(order) / num(conc);
  const total = num(perKg) * num(kg);
  const m = num(cm) / 100;
  const bmi = num(bw) / (m * m);
  const bmiLabel = !Number.isFinite(bmi) ? '' : bmi < 18.5 ? '저체중' : bmi < 23 ? '정상' : bmi < 25 ? '과체중' : '비만';

  return (
    <div className="calc">
      <div className="seg" role="tablist">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="card2">
        {tab === 'drip' && (
          <>
            <Field label="총 수액량" unit="mL" value={vol} onChange={setVol} />
            <Field label="투여 시간" unit="시간" value={hours} onChange={setHours} />
            <div className="f2">
              <span>드롭 팩터</span>
              <div className="chips">
                {[10, 15, 20, 60].map(f => (
                  <button key={f} className={factor === f ? 'on' : ''} onClick={() => setFactor(f)}>{f} gtt/mL</button>
                ))}
              </div>
            </div>
            <Result rows={[
              { label: '분당 방울 수', value: fmt(gtt), unit: 'gtt/min', main: true },
              { label: '시간당 속도', value: fmt(mlhr), unit: 'mL/hr' },
            ]} />
          </>
        )}

        {tab === 'dose' && (
          <>
            <Field label="처방 용량" unit="mg" value={order} onChange={setOrder} />
            <Field label="약 농도 (1 mL당)" unit="mg/mL" value={conc} onChange={setConc} />
            <Result rows={[{ label: '투여량', value: fmt(ml, 2), unit: 'mL', main: true }]} />
          </>
        )}

        {tab === 'weight' && (
          <>
            <Field label="체중당 용량" unit="mg/kg" value={perKg} onChange={setPerKg} />
            <Field label="체중" unit="kg" value={kg} onChange={setKg} />
            <Result rows={[{ label: '총 용량', value: fmt(total, 2), unit: 'mg', main: true }]} />
          </>
        )}

        {tab === 'bmi' && (
          <>
            <Field label="키" unit="cm" value={cm} onChange={setCm} />
            <Field label="체중" unit="kg" value={bw} onChange={setBw} />
            <Result rows={[
              { label: 'BMI', value: fmt(bmi), unit: 'kg/m²', main: true },
              ...(bmiLabel ? [{ label: '대한비만학회 기준', value: bmiLabel, unit: '' }] : []),
            ]} />
          </>
        )}
      </div>

      <style jsx>{`
        .calc { display: flex; flex-direction: column; gap: 14px; }
        .seg { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; }
        .seg button { flex: 1; padding: 9px 0; border: none; background: transparent; border-radius: 9px; font-size: 0.9375rem; font-weight: 700; color: #64748b; cursor: pointer; }
        .seg button.on { background: #fff; color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .card2 { display: flex; flex-direction: column; gap: 14px; background: var(--background); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
        .f2 { display: flex; flex-direction: column; gap: 6px; }
        .f2 span { font-size: 0.8125rem; font-weight: 700; color: var(--sub-text); }
        .chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .chips button { flex: 1; padding: 9px 6px; border: 1px solid var(--border); border-radius: 9px; background: transparent; font-size: 0.8125rem; font-weight: 700; color: var(--sub-text); cursor: pointer; white-space: nowrap; }
        .chips button.on { background: var(--primary); border-color: var(--primary); color: #fff; }
      `}</style>
    </div>
  );
}
