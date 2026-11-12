'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { ChartData, Row } from '../types';

type ColType = 'text' | 'area' | 'select' | 'check';
type Col = { key: string; label: string; w: string; type?: ColType; opts?: string[]; ph?: string };
type ListKey = 'vitals' | 'io' | 'meds' | 'labs' | 'notes' | 'care';

const TABS: { id: 'info' | ListKey; label: string }[] = [
  { id: 'info', label: '환자정보' },
  { id: 'vitals', label: '활력징후' },
  { id: 'io', label: 'I&O' },
  { id: 'meds', label: '투약' },
  { id: 'labs', label: '검사' },
  { id: 'notes', label: '간호기록' },
  { id: 'care', label: '간호과정' },
];

const COLS: Record<ListKey, Col[]> = {
  vitals: [
    { key: 'time', label: '시간', w: '70px', ph: '08:00' },
    { key: 'bp', label: '혈압', w: '1fr', ph: '120/80' },
    { key: 'hr', label: '맥박', w: '1fr' },
    { key: 'rr', label: '호흡', w: '1fr' },
    { key: 'bt', label: '체온', w: '1fr' },
    { key: 'spo2', label: 'SpO₂', w: '1fr' },
    { key: 'pain', label: '통증', w: '1fr', ph: '0-10' },
  ],
  io: [
    { key: 'time', label: '시간', w: '90px', ph: '08-12' },
    { key: 'intake', label: '섭취 (mL)', w: '1.4fr' },
    { key: 'output', label: '배설 (mL)', w: '1.4fr' },
    { key: 'note', label: '비고', w: '1.6fr' },
  ],
  meds: [
    { key: 'time', label: '시간', w: '70px' },
    { key: 'drug', label: '약물', w: '1.6fr' },
    { key: 'dose', label: '용량', w: '1fr' },
    { key: 'route', label: '경로', w: '84px', type: 'select', opts: ['', 'PO', 'IV', 'IM', 'SC', 'SL', 'Inh', '기타'] },
    { key: 'done', label: '투여', w: '64px', type: 'check' },
    { key: 'note', label: '관찰·비고', w: '1.6fr' },
  ],
  labs: [
    { key: 'name', label: '검사', w: '1.4fr' },
    { key: 'value', label: '결과', w: '1fr' },
    { key: 'ref', label: '참고치', w: '1.2fr' },
    { key: 'flag', label: '판정', w: '84px', type: 'select', opts: ['', 'H', 'L', 'N'] },
  ],
  notes: [
    { key: 'time', label: '시간', w: '70px' },
    { key: 'focus', label: 'Focus', w: '1fr', type: 'area' },
    { key: 'd', label: 'D (자료)', w: '1.5fr', type: 'area' },
    { key: 'a', label: 'A (중재)', w: '1.5fr', type: 'area' },
    { key: 'r', label: 'R (반응)', w: '1.5fr', type: 'area' },
  ],
  care: [
    { key: 'dx', label: '간호진단', w: '1fr', type: 'area' },
    { key: 'goal', label: '목표', w: '1fr', type: 'area' },
    { key: 'plan', label: '중재', w: '1.6fr', type: 'area' },
    { key: 'eval', label: '평가', w: '1fr', type: 'area' },
  ],
};

const num = (v: string) => parseFloat((v || '').replace(/[^0-9.]/g, ''));
// 활력징후 범위를 벗어나면 빨갛게 표시
function abnormal(key: string, v: string): boolean {
  if (!v) return false;
  if (key === 'bp') {
    const [s, d] = v.split('/').map(num);
    return (!isNaN(s) && (s >= 140 || s < 90)) || (!isNaN(d) && (d >= 90 || d < 60));
  }
  const n = num(v);
  if (isNaN(n)) return false;
  if (key === 'hr') return n > 100 || n < 60;
  if (key === 'rr') return n > 20 || n < 12;
  if (key === 'bt') return n >= 37.5 || n < 36;
  if (key === 'spo2') return n < 95;
  if (key === 'pain') return n >= 4;
  return false;
}

const INFO: { key: string; label: string; area?: boolean; full?: boolean }[] = [
  { key: 'name', label: '이름' },
  { key: 'ageSex', label: '나이 / 성별' },
  { key: 'dx', label: '진단명', full: true },
  { key: 'admit', label: '입원일' },
  { key: 'allergy', label: '알레르기' },
  { key: 'cc', label: '주호소', full: true },
  { key: 'history', label: '과거력', full: true },
  { key: 'orders', label: '의사 처방 · 간호 지시', area: true, full: true },
];

export default function EhrEditor({
  id,
  initialTitle,
  subject,
  initial,
}: {
  id: string;
  initialTitle: string;
  subject: string | null;
  initial: ChartData;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [data, setData] = useState<ChartData>(initial);
  const [tab, setTab] = useState<'info' | ListKey>('info');
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus('saving');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ehr/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, subject, data }),
        });
        setStatus(res.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [title, data, id, subject]);

  const setInfo = (k: string, v: string) => setData(d => ({ ...d, info: { ...d.info, [k]: v } }));
  const setCell = (lk: ListKey, i: number, k: string, v: string) =>
    setData(d => ({ ...d, [lk]: d[lk].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRow = (lk: ListKey) => setData(d => ({ ...d, [lk]: [...d[lk], {} as Row] }));
  const delRow = (lk: ListKey, i: number) => setData(d => ({ ...d, [lk]: d[lk].filter((_, j) => j !== i) }));

  const info = data.info;
  const hasAllergy = !!info.allergy && !/^(없음|none|-)$/i.test(info.allergy.trim());

  return (
    <div className="ehr">
      <div className="top">
        <Link href="/ehr" className="back">← 목록</Link>
        <input className="title" value={title} onChange={e => setTitle(e.target.value)} aria-label="제목" />
        <span className={`st ${status}`}>{status === 'saved' ? '저장됨' : status === 'saving' ? '저장 중…' : '저장 실패'}</span>
      </div>

      <div className="banner">
        <b>{info.name || '이름 없음'}</b>
        {info.ageSex && <span>{info.ageSex}</span>}
        {info.dx && <span className="dx">{info.dx}</span>}
        {hasAllergy && <span className="allergy">알레르기 {info.allergy}</span>}
      </div>

      <nav className="tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'info' ? (
        <div className="card infoGrid">
          {INFO.map(f => (
            <label key={f.key} className={f.full ? 'full' : ''}>
              <span>{f.label}</span>
              {f.area ? (
                <textarea rows={5} value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
              ) : (
                <input value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
              )}
            </label>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="grid head" style={{ gridTemplateColumns: `${COLS[tab].map(c => c.w).join(' ')} 28px` }}>
            {COLS[tab].map(c => <span key={c.key}>{c.label}</span>)}
            <span />
          </div>
          {data[tab].map((row, i) => (
            <div key={i} className="grid row" style={{ gridTemplateColumns: `${COLS[tab].map(c => c.w).join(' ')} 28px` }}>
              {COLS[tab].map(c => {
                const v = row[c.key] || '';
                const bad = tab === 'vitals' ? abnormal(c.key, v) : tab === 'labs' && c.key === 'flag' && (v === 'H' || v === 'L');
                return (
                  <label key={c.key} className="cell">
                    <em>{c.label}</em>
                    {c.type === 'select' ? (
                      <select value={v} className={bad ? 'bad' : ''} onChange={e => setCell(tab, i, c.key, e.target.value)}>
                        {c.opts!.map(o => <option key={o} value={o}>{o || '-'}</option>)}
                      </select>
                    ) : c.type === 'check' ? (
                      <input type="checkbox" className="chk" checked={v === '확인'} onChange={e => setCell(tab, i, c.key, e.target.checked ? '확인' : '')} />
                    ) : c.type === 'area' ? (
                      <textarea rows={3} value={v} onChange={e => setCell(tab, i, c.key, e.target.value)} />
                    ) : (
                      <input value={v} placeholder={c.ph} className={bad ? 'bad' : ''} onChange={e => setCell(tab, i, c.key, e.target.value)} />
                    )}
                  </label>
                );
              })}
              <button type="button" className="del" aria-label="행 삭제" onClick={() => delRow(tab, i)}>×</button>
            </div>
          ))}
          <button type="button" className="add" onClick={() => addRow(tab)}>+ 행 추가</button>
        </div>
      )}

      <style jsx global>{`
        .ehr .top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .ehr .back { font-size: 0.8125rem; color: var(--sub-text); text-decoration: none; white-space: nowrap; }
        .ehr .title { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 1.125rem; font-weight: 800; color: var(--text); font-family: inherit; padding: 4px 0; }
        .ehr .title:focus { outline: none; border-bottom: 2px solid var(--primary); }
        .ehr .st { font-size: 0.75rem; color: var(--sub-text); white-space: nowrap; }
        .ehr .st.error { color: #b91c1c; font-weight: 700; }
        .ehr .banner { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 10px 14px; background: var(--primary); color: #fff; border-radius: 10px; margin-bottom: 10px; font-size: 0.875rem; }
        .ehr .banner b { font-size: 1rem; }
        .ehr .banner .dx { opacity: 0.85; }
        .ehr .banner .allergy { background: #fee2e2; color: #991b1b; font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; }
        .ehr .tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        .ehr .tabs button { flex: 0 0 auto; border: 0; background: transparent; padding: 9px 14px; font-size: 0.875rem; font-weight: 600; color: var(--sub-text); border-bottom: 2px solid transparent; font-family: inherit; cursor: pointer; }
        .ehr .tabs button.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 800; }
        .ehr .card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
        .ehr .infoGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ehr .infoGrid .full { grid-column: 1 / -1; }
        .ehr label span, .ehr .cell em { display: block; font-size: 0.75rem; font-weight: 600; color: var(--sub-text); margin-bottom: 4px; font-style: normal; }
        .ehr input:not(.chk), .ehr textarea, .ehr select { box-sizing: border-box; width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: inherit; color: var(--text); background: #fff; }
        .ehr textarea { resize: vertical; line-height: 1.5; }
        .ehr input:focus, .ehr textarea:focus, .ehr select:focus { outline: 2px solid var(--primary); outline-offset: -1px; }
        .ehr .bad { color: #b91c1c; font-weight: 800; border-color: #fca5a5 !important; background: #fef2f2 !important; }
        .ehr .grid { display: grid; gap: 6px; align-items: start; }
        .ehr .grid.head { font-size: 0.75rem; font-weight: 700; color: var(--sub-text); padding: 0 0 6px; }
        .ehr .grid.row { padding: 3px 0; }
        .ehr .cell em { display: none; }
        .ehr .chk { width: 20px; height: 20px; margin-top: 8px; accent-color: var(--primary); }
        .ehr .del { border: 0; background: transparent; color: var(--sub-text); font-size: 1.125rem; cursor: pointer; height: 34px; }
        .ehr .add { margin-top: 10px; width: 100%; border: 1px dashed var(--border); background: var(--muted-background); border-radius: 8px; padding: 9px; font-size: 0.8125rem; font-weight: 700; color: var(--primary); font-family: inherit; cursor: pointer; }
        @media (max-width: 760px) {
          .ehr .infoGrid { grid-template-columns: 1fr; }
          .ehr .grid.head { display: none; }
          .ehr .grid.row { grid-template-columns: 1fr 1fr !important; padding: 12px 0; border-bottom: 1px solid var(--border); gap: 8px; position: relative; }
          .ehr .cell em { display: block; }
          .ehr .del { position: absolute; top: 4px; right: 0; }
          .ehr .cell:has(textarea) { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  );
}
