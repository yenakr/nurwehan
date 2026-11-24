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
  { key: 'bst', label: '혈당·인슐린' },
  { key: 'diet', label: '식이' },
  { key: 'dxcode', label: '상병코드' },
  { key: 'nact', label: '간호행위' },
  { key: 'mat', label: '처치재료' },
  { key: 'dietord', label: '식이처방' },
  { key: 'ret', label: '약·주사 반납' },
  { key: 'acu', label: '중증도·고위험' },
  { key: 'sched', label: '당일 일정' },
  { key: 'docs', label: '간호 서식지' },
  { key: 'dcnote', label: '퇴원예고' },
  { key: 'dcmed', label: '퇴원약' },
  { key: 'consent', label: '동의서' },
  { key: 'surgery', label: '수술기록' },
  { key: 'memos', label: '메모·인수인계' },
  { key: 'mar', label: '투약 수행' },
  { key: 'lines', label: '튜브·라인' },
  { key: 'iv', label: 'IV 수액' },
  { key: 'wounds', label: '상처·드레싱' },
  { key: 'edu', label: '환자 교육' },
  { key: 'specimen', label: '검체 채취' },
  { key: 'transport', label: '이송 의뢰' },
  { key: 'moves', label: '전동·전과·외출' },
  { key: 'cpr', label: 'CPR 기록지' },
  { key: 'anes', label: '마취기록' },
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFb, setShowFb] = useState(true);
  const [fbs, setFbs] = useState<Record<number, string>>(() => Object.fromEntries(data.notes.map((n, i) => [i, n.fb || ''])));
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const md = (t: string | undefined) => (t || '').match(/^(?:\d{4}-)?(\d{2}-\d{2})/)?.[1] || '';
  const inRange = (t: string | undefined) => {
    const d = md(t);
    if (!d) return true;
    return (!from || d >= from.slice(5)) && (!to || d <= to.slice(5));
  };
  const saveFb = async (i: number) => {
    const r = await fetch(`/api/admin/ehr/${id}/note`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ index: i, text: fbs[i] || '' }) });
    if (r.ok) setSaved(s => ({ ...s, [i]: true }));
    else notify('저장하지 못했어요.');
  };
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
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <style>{`@media print { .noprint { display: none !important; } }`}</style>
        <div className="noprint" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <b style={{ fontSize: 14, marginRight: 'auto' }}>간호기록</b>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} aria-label="시작일" />
          <span>~</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} aria-label="종료일" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={showFb} onChange={e => setShowFb(e.target.checked)} />코멘트 표시</label>
          <button type="button" onClick={() => window.print()} style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '6px 14px', background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer' }}>인쇄</button>
        </div>
        {data.notes.length === 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--sub-text)' }}>입력한 내용이 없어요.</p>}
        {data.notes.map((n, i) => !inRange(n.time) ? null : (
          <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 13.5, lineHeight: 1.6 }}>
            <div style={{ color: 'var(--sub-text)', fontSize: 12 }}>{n.time} · {n.focus} · {n.author}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{n.text}</div>
            {showFb && (
              <div className="noprint" style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={fbs[i] || ''} onChange={e => { setFbs(f => ({ ...f, [i]: e.target.value })); setSaved(s => ({ ...s, [i]: false })); }} placeholder="코멘트" maxLength={600} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 9px', font: 'inherit', background: 'transparent', color: 'inherit' }} />
                <button type="button" onClick={() => saveFb(i)} style={{ border: 0, borderRadius: 8, padding: '0 14px', background: saved[i] ? '#2f7a46' : 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>{saved[i] ? '등록됨' : '등록'}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {SECTIONS.filter(s => s.key !== 'notes').filter(s => (data[s.key as keyof ChartData] as Row[]).length > 0 || ['vitals', 'io', 'labs'].includes(s.key)).map(s => (
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
