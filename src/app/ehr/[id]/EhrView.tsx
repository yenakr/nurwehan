'use client';

import Link from 'next/link';
import type { ChartData, Row } from '../types';
import { COLS } from './EhrEditor';
import { IoTotals } from './EhrExtras';

type Key = keyof typeof COLS;

const SECTIONS: { key: Key; label: string; rev?: boolean }[] = [
  { key: 'vitals', label: '활력징후' },
  { key: 'io', label: '섭취/배설' },
  { key: 'bst', label: '혈당·인슐린' },
  { key: 'mar', label: '투약' },
  { key: 'notes', label: '간호기록', rev: true },
  { key: 'care', label: '간호과정' },
  { key: 'diet', label: '식이' },
  { key: 'labs', label: '검사결과' },
  { key: 'progress', label: '경과기록', rev: true },
  { key: 'lines', label: '튜브·라인' },
  { key: 'iv', label: 'IV 수액' },
  { key: 'wounds', label: '상처·드레싱' },
  { key: 'nutrition', label: '영양기록' },
];

function Block({ label, rows, k, rev, extra }: { label: string; rows: Row[]; k: Key; rev?: boolean; extra?: React.ReactNode }) {
  const cols = COLS[k].filter(c => rows.some(r => r[c.key]));
  if (!rows.length || !cols.length) return null;
  const list = rev ? [...rows].reverse() : rows;
  return (
    <section className="vb">
      <h3>{label}<span>{rows.length}</span></h3>
      <div className="vt">
        <table>
          <thead><tr>{cols.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={i}>{cols.map(c => <td key={c.key}>{r[c.key] || ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {extra}
    </section>
  );
}

export default function EhrView({ id, title, data }: { id: string; title: string; data: ChartData }) {
  const i = data.info;
  const allergy = !!i.allergy && !/^(없음|무|none|-)$/i.test(i.allergy.trim());
  const shown = SECTIONS.filter(s => (data[s.key as keyof ChartData] as Row[] | undefined)?.length);
  return (
    <div className="ev">
      <header className="evh">
        <div className="evp">
          <b>{i.name || title}</b>
          <span>{[i.ageSex, i.ward && `${i.ward} ${i.bed || ''}`.trim(), i.dept].filter(Boolean).join(' · ')}</span>
          {i.dx && <span className="dx">{i.dx}</span>}
        </div>
        {allergy && <span className="al">알러지 {i.allergy}</span>}
        <div className="evb">
          <Link href="/ehr" className="g">병동뷰</Link>
          <Link href={`/ehr/${id}?edit=1`} className="p">기록 입력</Link>
        </div>
      </header>
      {shown.length === 0 && <p className="none">아직 입력한 기록이 없어요.</p>}
      {shown.map(s => (
        <Block key={s.key} label={s.label} k={s.key} rev={s.rev} rows={data[s.key as keyof ChartData] as Row[]}
          extra={s.key === 'io' ? <IoTotals rows={data.io} /> : undefined} />
      ))}
      <style>{`
        .ev{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
        .evh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--background);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
        .evp{flex:1;min-width:200px;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
        .evp b{font-size:1.0625rem}
        .evp span{font-size:.8125rem;color:var(--sub-text)}
        .evp .dx{flex-basis:100%;color:var(--text)}
        .al{font-size:.75rem;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(239,68,68,.14);color:#dc2626}
        .evb{display:flex;gap:6px}
        .evb a{padding:6px 12px;font-size:.8125rem;font-weight:600;border-radius:8px;border:1px solid var(--primary);text-decoration:none}
        .evb .p{background:var(--primary);color:#fff}
        .evb .g{color:var(--primary)}
        .vb{background:var(--background);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
        .vb h3{margin:0 0 8px;font-size:.9375rem;display:flex;gap:6px;align-items:center}
        .vb h3 span{font-size:.6875rem;color:var(--sub-text);font-weight:600}
        .vt{overflow-x:auto}
        .vt table{width:100%;border-collapse:collapse;font-size:.8125rem}
        .vt th{text-align:left;padding:6px 8px;color:var(--sub-text);font-weight:600;white-space:nowrap;border-bottom:1px solid var(--border)}
        .vt td{padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;white-space:pre-wrap}
        .vt tr:last-child td{border-bottom:0}
        .none{text-align:center;color:var(--sub-text);font-size:.875rem;padding:24px 0}
      `}</style>
    </div>
  );
}
