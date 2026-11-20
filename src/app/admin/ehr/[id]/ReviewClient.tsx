'use client';

import { useState, type CSSProperties } from 'react';
import { COLS } from '@/app/ehr/[id]/EhrEditor';
import type { ChartData, Row } from '@/app/ehr/types';
import { FORMS, formLine } from '@/app/ehr/[id]/EhrForms';
import { notify } from '@/components/Dialog';

const SECTIONS = ([
  { key: 'notes', label: '간호기록' },
  { key: 'vitals', label: '임상관찰' },
  { key: 'io', label: '섭취/배설' },
  { key: 'labs', label: '검사결과' },
  { key: 'progress', label: '경과기록' },
  { key: 'risk', label: '위험도평가' },
  { key: 'handover', label: '인계(SBAR)' },
  { key: 'transfusion', label: '수혈기록' },
  { key: 'nutrition', label: '영양기록' },
  { key: 'consult', label: '협진기록' },
  { key: 'consent', label: '동의서' },
  { key: 'surgery', label: '수술기록' },
  { key: 'memos', label: '메모·인수인계' },
]).filter(s => !!(COLS as Record<string, unknown>)[s.key]) as { key: keyof typeof COLS; label: string }[];

const th: CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--sub-text)', fontWeight: 600, whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '6px 8px', borderBottom: '1px solid var(--border)', verticalAlign: 'top', whiteSpace: 'pre-wrap' };

function Table({ rows, cols }: { rows: Row[]; cols: { key: string; label: string }[] }) {
  const used = cols.filter(c => rows.some(r => r[c.key]));
  if (!rows.length || !used.length) return <p style={{ margin: 0, fontSize: 13, color: 'var(--sub-text)' }}>입력한 내용이 없어요.</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr>{used.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{used.map(c => <td key={c.key} style={td}>{r[c.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function ReviewClient({ id, data }: { id: string; data: ChartData }) {
  const [text, setText] = useState(data.info.comment || '');
  const [busy, setBusy] = useState(false);
  const info = data.info;

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/ehr/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ comment: text }) });
      notify(r.ok ? '저장했어요. 학생에게 확인 완료로 보여요.' : '저장하지 못했어요.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 16, fontSize: 14, lineHeight: 1.7 }}>
        <b>{[info.name, info.ageSex].filter(Boolean).join(' · ')}</b>
        <div style={{ color: 'var(--sub-text)' }}>{[info.ward, info.bed, info.dx].filter(Boolean).join(' · ')}</div>
        {info.cc && <div>주호소: {info.cc}</div>}
        {info.pmh && <div>과거력: {info.pmh}</div>}
      </div>
      {SECTIONS.filter(s => (data[s.key as keyof ChartData] as Row[]).length > 0 || ['notes', 'vitals', 'io', 'labs'].includes(s.key)).map(s => (
        <div key={s.key} className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>{s.label}</h3>
          <Table rows={data[s.key as keyof ChartData] as Row[]} cols={COLS[s.key]} />
        </div>
      ))}
      {FORMS.some(f => (data.forms?.[f.key] || []).length > 0) && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>평가도구</h3>
          {FORMS.map(f => (data.forms?.[f.key] || []).length > 0 && (
            <div key={f.key} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 6 }}>
              <b>{f.label}</b>
              {(data.forms[f.key] || []).map((r, i) => <div key={i} style={{ color: 'var(--sub-text)' }}>{r.time} · {formLine(f.key, r)}</div>)}
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>간호과정</h3>
        <Table rows={data.care} cols={Array.from(new Set(data.care.flatMap(r => Object.keys(r)))).filter(k => k !== 'kind').map(k => ({ key: k, label: k }))} />
      </div>
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b style={{ fontSize: 14 }}>교수님 의견</b>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} maxLength={1500} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 10, padding: 10, font: 'inherit', background: 'transparent', color: 'inherit' }} />
        <button type="button" onClick={save} disabled={busy} style={{ alignSelf: 'flex-end', border: 0, borderRadius: 999, padding: '10px 20px', background: 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>{busy ? '저장 중' : '저장'}</button>
      </div>
    </div>
  );
}
