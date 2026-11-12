'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChartData, Row } from '../types';

type ListKey = 'progress' | 'vitals' | 'io' | 'labs' | 'notes' | 'care';
type TabId = 'progress' | 'orders' | 'admission' | 'nurseinfo' | 'vitals' | 'labs' | 'notes' | 'care';

const TABS: { id: TabId; label: string }[] = [
  { id: 'progress', label: '경과기록' },
  { id: 'orders', label: '의사처방' },
  { id: 'admission', label: '입원기록' },
  { id: 'nurseinfo', label: '간호정보' },
  { id: 'vitals', label: '임상관찰' },
  { id: 'labs', label: '검사결과' },
  { id: 'notes', label: '간호기록' },
  { id: 'care', label: '간호과정' },
];

type Col = { key: string; label: string; w: number; type?: 'area' | 'select'; opts?: string[]; ph?: string };

const COLS: Record<ListKey, Col[]> = {
  progress: [
    { key: 'time', label: '기록일시', w: 130, ph: '2026-11-10 10:00' },
    { key: 'dept', label: '진료과', w: 60 },
    { key: 'text', label: '경과기록', w: 520, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  vitals: [
    { key: 'time', label: '시간', w: 80, ph: '08:00' },
    { key: 'bp', label: '혈압 (mmHg)', w: 110, ph: '120/80' },
    { key: 'hr', label: '맥박 (/min)', w: 90 },
    { key: 'rr', label: '호흡 (/min)', w: 90 },
    { key: 'bt', label: '체온 (℃)', w: 80 },
    { key: 'spo2', label: 'SpO₂ (%)', w: 80 },
    { key: 'pain', label: '통증 (NRS)', w: 80 },
  ],
  io: [
    { key: 'time', label: '시간', w: 80, ph: '08-12' },
    { key: 'intake', label: '섭취 (mL)', w: 200 },
    { key: 'output', label: '배설 (mL)', w: 200 },
    { key: 'note', label: '비고', w: 260 },
  ],
  labs: [
    { key: 'name', label: '검사명 (· 결과)', w: 200 },
    { key: 'value', label: '결과', w: 90 },
    { key: 'unit', label: '단위', w: 80 },
    { key: 'min', label: 'Min', w: 60 },
    { key: 'max', label: 'Max', w: 60 },
    { key: 'sample', label: '검체', w: 70 },
    { key: 'time', label: '검사일시', w: 110 },
  ],
  notes: [
    { key: 'time', label: '기록일시', w: 110, ph: '11-10 10:00' },
    { key: 'focus', label: 'Focus', w: 110 },
    { key: 'text', label: '간호기록', w: 560, type: 'area' },
    { key: 'author', label: '작성자', w: 80 },
  ],
  care: [
    { key: 'dx', label: '간호진단', w: 200, type: 'area' },
    { key: 'goal', label: '목표', w: 200, type: 'area' },
    { key: 'plan', label: '중재', w: 300, type: 'area' },
    { key: 'eval', label: '평가', w: 200, type: 'area' },
  ],
};

const num = (v: string) => parseFloat((v || '').replace(/[^0-9.\-]/g, ''));
function vitalBad(key: string, v: string): boolean {
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
// 검사결과: ▲ 높음(빨강) / ▼ 낮음(파랑)
function labFlag(r: Row): 'H' | 'L' | '' {
  const v = num(r.value || ''), lo = num(r.min || ''), hi = num(r.max || '');
  if (isNaN(v)) return '';
  if (!isNaN(hi) && v > hi) return 'H';
  if (!isNaN(lo) && v < lo) return 'L';
  return '';
}

// 입원기록 (문서 형태)
const ADM: { key: string; label: string; rows?: number }[] = [
  { key: 'cc', label: '주호소', rows: 1 },
  { key: 'onset', label: '발병시기', rows: 1 },
  { key: 'hpi', label: '현병력', rows: 5 },
  { key: 'pmh', label: '과거력', rows: 3 },
  { key: 'fh', label: '가족력', rows: 2 },
  { key: 'social', label: '개인력 및 사회력', rows: 2 },
  { key: 'pe', label: '신체검진', rows: 5 },
  { key: 'dx', label: '진단명', rows: 2 },
  { key: 'plan', label: '진료계획', rows: 4 },
];

// 입원 시 간호정보조사지
const NURSE: { key: string; label: string }[] = [
  { key: 'route', label: '입 원 경 로' },
  { key: 'method', label: '입 원 방 법' },
  { key: 'informant', label: '정보제공자' },
  { key: 'job', label: '직 업' },
  { key: 'religion', label: '종 교' },
  { key: 'marital', label: '결 혼' },
  { key: 'lang', label: '언 어' },
  { key: 'cc', label: '주 호 소' },
  { key: 'purpose', label: '입원목적' },
  { key: 'insight', label: '병식(insight)' },
  { key: 'allergy', label: '알레르기' },
  { key: 'social', label: '사회적특수성' },
  { key: 'drink', label: '음 주 력' },
  { key: 'smoke', label: '흡 연 력' },
  { key: 'bedsore', label: '욕 창 (Braden)' },
  { key: 'fall', label: '낙 상 (Morse)' },
  { key: 'pain', label: '통 증' },
];

const ORDER_STATUS = ['', '집계완료', '접수', '추가', '완료'];
const ROUTES = ['', 'PO', 'IV', 'IM', 'SC', 'SL', 'Inh', 'CIV', 'Top'];

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
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [data, setData] = useState<ChartData>(initial);
  const [tab, setTab] = useState<TabId>('orders');
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

  const info = data.info;
  const setInfo = (k: string, v: string) => setData(d => ({ ...d, info: { ...d.info, [k]: v } }));
  type AnyList = ListKey | 'orders';
  const setCell = (lk: AnyList, i: number, k: string, v: string) =>
    setData(d => ({ ...d, [lk]: d[lk].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRow = (lk: AnyList, init: Row = {}) => setData(d => ({ ...d, [lk]: [...d[lk], { ...init }] }));
  const delRow = (lk: AnyList, i: number) => setData(d => ({ ...d, [lk]: d[lk].filter((_, j) => j !== i) }));

  const hasAllergy = !!info.allergy && !/^(없음|무|none|-)$/i.test(info.allergy.trim());

  // 값이 비어 있어도 EMR처럼 보이도록 공통 입력 컴포넌트
  const Side = ({ k, label, big }: { k: string; label: string; big?: boolean }) => (
    <label className="sd">
      <em>{label}</em>
      <input className={big ? 'big' : ''} value={info[k] || ''} onChange={e => setInfo(k, e.target.value)} />
    </label>
  );

  const Tbl = ({ lk }: { lk: ListKey }) => {
    const cols = COLS[lk];
    const rows = data[lk];
    return (
      <div className="tw">
        <table className="tbl">
          <thead>
            <tr>
              {cols.map(c => <th key={c.key} style={{ minWidth: c.w }}>{c.label}</th>)}
              <th className="x" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="none">내용이 없어요</td></tr>
            )}
            {rows.map((row, i) => {
              const flag = lk === 'labs' ? labFlag(row) : '';
              return (
                <tr key={i}>
                  {cols.map(c => {
                    const v = row[c.key] || '';
                    const bad = lk === 'vitals' && vitalBad(c.key, v);
                    const cls = bad ? 'bad' : lk === 'labs' && (c.key === 'value') ? (flag === 'H' ? 'hi' : flag === 'L' ? 'lo' : '') : '';
                    return (
                      <td key={c.key}>
                        {lk === 'labs' && c.key === 'value' && flag && <span className={`mk ${cls}`}>{flag === 'H' ? '▲' : '▼'}</span>}
                        {c.type === 'area' ? (
                          <textarea rows={lk === 'notes' || lk === 'progress' ? 5 : 3} value={v} onChange={e => setCell(lk, i, c.key, e.target.value)} />
                        ) : (
                          <input className={cls} value={v} placeholder={c.ph} onChange={e => setCell(lk, i, c.key, e.target.value)} />
                        )}
                      </td>
                    );
                  })}
                  <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow(lk, i)}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="button" className="add" onClick={() => addRow(lk)}>+ 행 추가</button>
      </div>
    );
  };

  const orders = data.orders;
  let seq = 0;

  return (
    <div className="ehr">
      <div className="bar">
        <Link href="/ehr" className="back">← 병동</Link>
        <input className="ttl" value={title} onChange={e => setTitle(e.target.value)} aria-label="제목" />
        <span className={`st ${status}`}>{status === 'saved' ? '저장됨' : status === 'saving' ? '저장 중…' : '저장 실패'}</span>
        <button
          type="button"
          className="dis"
          onClick={async () => {
            if (!confirm('이 환자 차트를 삭제할까요? 입력한 내용이 모두 사라지고 되돌릴 수 없어요.')) return;
            const res = await fetch(`/api/ehr/${id}`, { method: 'DELETE' });
            if (res.ok) router.push('/ehr');
          }}
        >
          퇴원(삭제)
        </button>
      </div>

      <div className="shell">
        <div className="top">
          <span className="ward">{info.ward || '병동'} ▾</span>
          <nav role="tablist">
            {TABS.map(t => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="body">
          <aside className="side">
            <div className="brand">병동부</div>
            <Side k="ptNo" label="환자번호" />
            <Side k="name" label="이름" big />
            <Side k="ageSex" label="나이/성별" />
            <Side k="ward" label="병동" />
            <Side k="bed" label="병상" />
            <Side k="dept" label="진료과" />
            <Side k="doctor" label="주치의" />
            <Side k="admit" label="입원일" />
            <Side k="dx" label="진단명" />
            <Side k="allergy" label="알레르기" />
            {hasAllergy && <div className="alg">알레르기 있음</div>}
          </aside>

          <section className="main">
            {tab === 'orders' && (
              <div className="tw">
                <div className="ohead">
                  <span>처방일자 </span>
                  <input className="od" value={info.orderDate || ''} placeholder={info.admit || '2026-11-10'} onChange={e => setInfo('orderDate', e.target.value)} />
                </div>
                <table className="tbl ord">
                  <thead>
                    <tr>
                      <th className="ck" />
                      <th style={{ minWidth: 34 }}>순번</th>
                      <th style={{ minWidth: 260 }}>처방명</th>
                      <th style={{ minWidth: 50 }}>용량</th>
                      <th style={{ minWidth: 44 }}>단위</th>
                      <th style={{ minWidth: 54 }}>횟수</th>
                      <th style={{ minWidth: 56 }}>경로</th>
                      <th style={{ minWidth: 78 }}>진행상태</th>
                      {[1, 2, 3, 4, 5, 6].map(n => <th key={n} style={{ minWidth: 64 }}>{n}회</th>)}
                      <th className="x" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && <tr><td colSpan={15} className="none">처방이 없어요</td></tr>}
                    {orders.map((r, i) => {
                      if (r.kind === 'sec') {
                        return (
                          <tr key={i} className="sec">
                            <td colSpan={14}>
                              <input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} />
                            </td>
                            <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                          </tr>
                        );
                      }
                      if (r.kind === 'memo') {
                        return (
                          <tr key={i} className="memo">
                            <td className="ck" />
                            <td />
                            <td colSpan={12}>
                              <input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} />
                            </td>
                            <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                          </tr>
                        );
                      }
                      seq += 1;
                      return (
                        <tr key={i}>
                          <td className="ck">
                            <button type="button" className={r.ck ? 'on' : ''} aria-pressed={!!r.ck} aria-label="수행 확인" onClick={() => setCell('orders', i, 'ck', r.ck ? '' : '1')}>✓</button>
                          </td>
                          <td className="seq">{seq}</td>
                          <td><input value={r.name || ''} onChange={e => setCell('orders', i, 'name', e.target.value)} /></td>
                          <td><input className="r" value={r.dose || ''} onChange={e => setCell('orders', i, 'dose', e.target.value)} /></td>
                          <td><input value={r.unit || ''} onChange={e => setCell('orders', i, 'unit', e.target.value)} /></td>
                          <td><input value={r.cnt || ''} onChange={e => setCell('orders', i, 'cnt', e.target.value)} /></td>
                          <td>
                            <select value={r.route || ''} onChange={e => setCell('orders', i, 'route', e.target.value)}>
                              {(ROUTES.includes(r.route || '') ? ROUTES : [...ROUTES, r.route]).map(o => <option key={o} value={o}>{o || ''}</option>)}
                            </select>
                          </td>
                          <td>
                            <select value={r.st || ''} className={r.st === '집계완료' ? 'done' : ''} onChange={e => setCell('orders', i, 'st', e.target.value)}>
                              {(ORDER_STATUS.includes(r.st || '') ? ORDER_STATUS : [...ORDER_STATUS, r.st]).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <td key={n}><input value={r[`t${n}`] || ''} onChange={e => setCell('orders', i, `t${n}`, e.target.value)} /></td>
                          ))}
                          <td className="x"><button type="button" aria-label="행 삭제" onClick={() => delRow('orders', i)}>×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="adds">
                  <button type="button" className="add" onClick={() => addRow('orders', { kind: 'sec', name: '▶ 구분 ◀' })}>+ 구분</button>
                  <button type="button" className="add" onClick={() => addRow('orders')}>+ 처방</button>
                  <button type="button" className="add" onClick={() => addRow('orders', { kind: 'memo', name: '※ ' })}>+ 메모</button>
                </div>
              </div>
            )}

            {tab === 'admission' && (
              <div className="doc">
                <div className="dh">{info.admit || '입원일'}<span>입원기록</span></div>
                {ADM.map(f => (
                  <div key={f.key} className="ds">
                    <h4>■ {f.label}</h4>
                    {f.rows === 1 ? (
                      <input value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                    ) : (
                      <textarea rows={f.rows} value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'nurseinfo' && (
              <div className="doc">
                <div className="dh">{info.admit || '입원일'}<span>입원 시 간호정보조사지</span></div>
                <div className="nl">
                  {NURSE.map(f => (
                    <label key={f.key}>
                      <b>[ {f.label} ]</b>
                      <input value={info[f.key] || ''} onChange={e => setInfo(f.key, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tab === 'vitals' && (
              <>
                <h4 className="ph">활력징후</h4>
                <Tbl lk="vitals" />
                <h4 className="ph">섭취/배설 (I&amp;O)</h4>
                <Tbl lk="io" />
              </>
            )}

            {(tab === 'progress' || tab === 'labs' || tab === 'notes' || tab === 'care') && <Tbl lk={tab} />}
          </section>
        </div>
      </div>

      <style jsx global>{`
        .ehr { --nv1: #1c2f4b; --nv2: #13233a; --tl: #cfe5e6; --ln: #cfd5dc; }
        .ehr .bar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .ehr .back { font-size: 0.8125rem; color: var(--sub-text); text-decoration: none; white-space: nowrap; }
        .ehr .ttl { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 1rem; font-weight: 800; color: var(--text); font-family: inherit; padding: 4px 0; }
        .ehr .ttl:focus { outline: none; border-bottom: 2px solid var(--primary); }
        .ehr .st { font-size: 0.75rem; color: var(--sub-text); white-space: nowrap; }
        .ehr .dis { border: 0; background: transparent; color: var(--sub-text); font-size: 0.75rem; font-family: inherit; cursor: pointer; }
        .ehr .st.error { color: #b91c1c; font-weight: 700; }

        .ehr .shell { border: 1px solid #94a3b8; background: #fff; border-radius: 4px; overflow: hidden; font-size: 12.5px; color: #1f2937; }
        .ehr .top { display: flex; align-items: stretch; background: linear-gradient(#233a5c, #17283f); }
        .ehr .ward { flex: 0 0 auto; display: flex; align-items: center; padding: 0 16px; color: #e2e8f0; font-weight: 700; font-size: 13px; border-right: 1px solid rgba(255,255,255,0.15); }
        .ehr .top nav { display: flex; overflow-x: auto; }
        .ehr .top nav button { flex: 0 0 auto; border: 0; background: transparent; color: #e5ebf3; padding: 11px 14px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border-right: 1px solid rgba(255,255,255,0.08); }
        .ehr .top nav button.on { color: #38d6ff; box-shadow: inset 0 -3px 0 #38d6ff; }

        .ehr .body { display: grid; grid-template-columns: 188px minmax(0, 1fr); min-height: 560px; }
        .ehr .side { background: var(--nv1); color: #fff; padding: 12px 12px 18px; display: flex; flex-direction: column; gap: 8px; }
        .ehr .brand { text-align: center; font-weight: 800; letter-spacing: 1px; color: #e8c97a; padding: 4px 0 10px; border-bottom: 1px solid rgba(255,255,255,0.15); }
        .ehr .sd em { display: block; font-size: 10.5px; font-style: normal; color: #8fb0d2; margin-bottom: 1px; }
        .ehr .sd input { box-sizing: border-box; width: 100%; padding: 3px 4px; border: 0; border-bottom: 1px solid rgba(255,255,255,0.18); background: transparent; color: #fff; font-size: 12.5px; font-family: inherit; }
        .ehr .sd input.big { font-size: 20px; font-weight: 800; padding: 2px 4px; }
        .ehr .sd input:focus { outline: none; background: rgba(255,255,255,0.1); }
        .ehr .alg { background: #7f1d1d; color: #fee2e2; font-weight: 700; font-size: 11.5px; padding: 4px 8px; border-radius: 4px; text-align: center; }

        .ehr .main { background: #f1f3f5; padding: 10px; min-width: 0; }
        .ehr .tw { background: #fff; border: 1px solid var(--ln); overflow-x: auto; margin-bottom: 10px; }
        .ehr .ph { margin: 6px 2px 6px; font-size: 12.5px; color: #1d4e89; font-weight: 800; }
        .ehr .ohead { padding: 6px 10px; border-bottom: 1px solid var(--ln); font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .ehr .od { width: 110px; border: 1px solid var(--ln); padding: 2px 6px; font-size: 12.5px; font-family: inherit; }

        .ehr .tbl { width: 100%; border-collapse: collapse; }
        .ehr .tbl th { background: #e9edf1; border: 1px solid var(--ln); padding: 5px 6px; font-weight: 700; font-size: 12px; white-space: nowrap; }
        .ehr .tbl td { border: 1px solid #e1e5ea; padding: 0; vertical-align: top; position: relative; }
        .ehr .tbl .none { text-align: center; color: #94a3b8; padding: 18px; }
        .ehr .tbl input, .ehr .tbl textarea, .ehr .tbl select { box-sizing: border-box; width: 100%; border: 0; background: transparent; padding: 5px 6px; font-size: 12.5px; font-family: inherit; color: #1f2937; }
        .ehr .tbl textarea { resize: vertical; line-height: 1.55; }
        .ehr .tbl input.r { text-align: right; }
        .ehr .tbl select { appearance: none; -webkit-appearance: none; cursor: pointer; }
        .ehr .tbl select.done { color: #0f766e; font-weight: 700; }
        .ehr .tbl input:focus, .ehr .tbl textarea:focus, .ehr .tbl select:focus { outline: 1px solid #2563eb; outline-offset: -1px; background: #fffdf0; }
        .ehr .tbl .bad, .ehr .tbl .hi { color: #dc2626; font-weight: 800; }
        .ehr .tbl .lo { color: #2563eb; font-weight: 800; }
        .ehr .mk { position: absolute; left: 4px; top: 6px; font-size: 10px; }
        .ehr .mk.hi { color: #dc2626; }
        .ehr .mk.lo { color: #2563eb; }
        .ehr .tbl .x { width: 24px; text-align: center; border: 0; background: #fff; }
        .ehr .tbl .x button { border: 0; background: transparent; color: #b4bcc7; cursor: pointer; font-size: 15px; padding: 3px 4px; }
        .ehr .tbl tr:hover .x button { color: #dc2626; }
        .ehr .ord .ck { width: 26px; text-align: center; background: #fff; }
        .ehr .ord .ck button { border: 0; background: transparent; color: #d4dae1; font-size: 13px; font-weight: 900; cursor: pointer; padding: 4px; }
        .ehr .ord .ck button.on { color: #16a34a; }
        .ehr .ord .seq { text-align: center; color: #64748b; padding-top: 6px; }
        .ehr .ord tr.sec td { background: var(--tl); }
        .ehr .ord tr.sec td.x { background: #fff; }
        .ehr .ord tr.sec input { font-weight: 800; color: #12303a; }
        .ehr .ord tr.memo input { color: #be185d; }
        .ehr .adds { display: flex; gap: 6px; padding: 8px; }
        .ehr .add { border: 1px solid var(--ln); background: #f8fafc; border-radius: 4px; padding: 5px 12px; font-size: 12px; font-weight: 700; color: #1d4e89; font-family: inherit; cursor: pointer; }
        .ehr .tw > .add { margin: 8px; }

        .ehr .doc { background: #fff; border: 1px solid var(--ln); padding: 16px 22px 22px; max-width: 860px; margin: 0 auto; }
        .ehr .dh { display: flex; justify-content: space-between; align-items: center; background: #c9a77a; color: #fff; font-weight: 700; padding: 3px 10px; margin-bottom: 12px; }
        .ehr .dh span { font-size: 13px; }
        .ehr .ds { margin-bottom: 12px; }
        .ehr .ds h4 { display: inline-block; margin: 0 0 4px; background: #dfe3fb; color: #1e2a6b; font-size: 12.5px; padding: 1px 10px 1px 4px; font-weight: 800; }
        .ehr .ds input, .ehr .ds textarea, .ehr .nl input { box-sizing: border-box; width: 100%; border: 0; border-bottom: 1px dashed #d5dae0; background: transparent; padding: 4px 4px; font-size: 13px; font-family: inherit; color: #111827; line-height: 1.6; }
        .ehr .ds textarea { resize: vertical; }
        .ehr .ds input:focus, .ehr .ds textarea:focus, .ehr .nl input:focus { outline: none; background: #fffdf0; border-bottom-color: #2563eb; }
        .ehr .nl { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 28px; }
        .ehr .nl label { display: flex; align-items: center; gap: 8px; }
        .ehr .nl b { flex: 0 0 112px; font-size: 12px; color: #334155; font-weight: 600; white-space: nowrap; }

        @media (max-width: 860px) {
          .ehr .body { grid-template-columns: 1fr; }
          .ehr .side { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; }
          .ehr .brand { grid-column: 1 / -1; padding-bottom: 6px; }
          .ehr .alg { grid-column: 1 / -1; }
          .ehr .nl { grid-template-columns: 1fr; }
          .ehr .doc { padding: 12px; }
        }
      `}</style>
    </div>
  );
}
