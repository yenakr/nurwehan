'use client';

import type { ChartData, Row } from '../types';
import { DEPTS } from '../directory';

// 병동뷰 측면 메뉴: 환자정보 · 상병이력 · 수술이력 · 방종이력
const CSS = `
  .pv { padding: 10px 14px; font-size: 13px; }
  .pv h4 { margin: 14px 0 6px; font-size: 13px; color: var(--primary); }
  .pv h4:first-child { margin-top: 0; }
  .pv table { width: 100%; min-width: 0 !important; border-collapse: collapse; }
  .pv th { background: #eaf0f7; text-align: left; padding: 5px 8px; border: 1px solid var(--border); white-space: nowrap; font-size: 12.5px; }
  .pv td { padding: 5px 8px; border: 1px solid var(--border); vertical-align: top; }
  .pv .kv { display: grid; grid-template-columns: 110px 1fr 110px 1fr; border: 1px solid var(--border); border-bottom: 0; }
  .pv .kv > * { padding: 6px 8px; border-bottom: 1px solid var(--border); }
  .pv .kv > b { background: #eaf0f7; font-weight: 700; font-size: 12.5px; }
  .pv .none { text-align: center; color: var(--sub-text); padding: 18px; }
  .pv .tg { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 0 8px; border-radius: 999px; background: rgba(59,130,246,.14); color: #1d4ed8; }
  .pv .tg.in { background: rgba(16,185,129,.15); color: #047857; } .pv .tg.er { background: rgba(239,68,68,.14); color: #b91c1c; }
  .pv .mn { color: #b45309; font-weight: 700; }
  @media (max-width: 700px) { .pv .kv { grid-template-columns: 90px 1fr; } }
`;
const dn = (c?: string) => DEPTS.find(x => x.code === c)?.name || c || '';
const d10 = (s?: string) => (s || '').slice(0, 10);

export function PatInfo({ data }: { data: ChartData }) {
  const i = data.info;
  const h = parseFloat(i.height || ''), w = parseFloat(i.weight || '');
  const bmi = h > 0 && w > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : '';
  const rows: [string, string][] = [
    ['환자번호', i.ptNo || ''], ['성명', i.name || ''],
    ['성별/나이', i.ageSex || ''], ['혈액형', i.blood || ''],
    ['키 / 체중', [i.height && `${i.height}cm`, i.weight && `${i.weight}kg`].filter(Boolean).join(' / ')], ['BMI', bmi],
    ['진료과', dn(i.dept)], ['병실', [i.ward, i.bed].filter(Boolean).join(' ')],
    ['지정의', i.doctor || ''], ['주치의', i.attending || ''],
    ['입원일', d10(i.admit)], ['퇴원예정일', d10(i.disDate)],
    ['건강보험', '건강보험 (모의 자격 확인)'], ['보호자', i.guardian || ''],
    ['알러지', i.allergy || ''], ['격리', i.iso || ''],
  ];
  return (
    <div className="pv">
      <style>{CSS}</style>
      <h4>환자 기본정보</h4>
      <div className="kv">{rows.flatMap(([k, v]) => [<b key={k}>{k}</b>, <span key={k + 'v'}>{v || '-'}</span>])}</div>
      <h4>진단명</h4>
      <p style={{ margin: 0 }}>{i.dx || '-'}</p>
    </div>
  );
}

export function DxHist({ data }: { data: ChartData }) {
  const dxs: Row[] = [...data.dxcode].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const hist: Row[] = [...data.history].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const cur = data.info.admit ? [{ date: d10(data.info.admit), kind: '입원', dept: data.info.dept || '', dx: data.info.dx || '', code: '' }] : [];
  const all = [...cur, ...hist];
  return (
    <div className="pv">
      <style>{CSS}</style>
      <h4>상병이력 (내원별)</h4>
      <table>
        <thead><tr><th>일자</th><th>구분</th><th>진료과</th><th>상병코드</th><th>상병명</th></tr></thead>
        <tbody>
          {all.map((r, k) => <tr key={k}><td>{d10(r.date)}</td><td><span className={`tg ${r.kind === '입원' ? 'in' : r.kind === '응급' ? 'er' : ''}`}>{r.kind || '외래'}</span></td><td>{dn(r.dept)}</td><td>{r.code}</td><td>{r.dx}</td></tr>)}
          {all.length === 0 && <tr><td colSpan={5} className="none">상병이력이 없어요</td></tr>}
        </tbody>
      </table>
      <h4>이번 입원 상병</h4>
      <table>
        <thead><tr><th>구분</th><th>상병코드</th><th>상병명</th><th>진단일</th><th>진단의</th></tr></thead>
        <tbody>
          {dxs.map((r, k) => <tr key={k}><td className={r.kind === '주상병' ? 'mn' : ''}>{r.kind}</td><td>{r.code}</td><td>{r.name}</td><td>{d10(r.date)}</td><td>{r.doc}</td></tr>)}
          {dxs.length === 0 && <tr><td colSpan={5} className="none">등록된 상병이 없어요</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function SurgHist({ data }: { data: ChartData }) {
  const rows = [...data.surgery].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const pod = (d?: string) => { const x = d10(d); if (!x) return ''; const n = Math.round((Date.now() - new Date(x).getTime()) / 86400000); return n >= 0 ? `POD#${n}` : ''; };
  return (
    <div className="pv">
      <style>{CSS}</style>
      <h4>수술이력</h4>
      <table>
        <thead><tr><th>수술일자</th><th>경과</th><th>진료과</th><th>수술명</th><th>마취</th><th>비고</th></tr></thead>
        <tbody>
          {rows.map((r, k) => <tr key={k}><td>{d10(r.date)}</td><td>{pod(r.date)}</td><td>{dn(r.dept)}</td><td>{r.name}</td><td>{r.anes}</td><td>{r.note}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={6} className="none">수술이력이 없어요</td></tr>}
        </tbody>
      </table>
      {data.info.pmh && (<><h4>과거력</h4><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{data.info.pmh}</p></>)}
    </div>
  );
}

export function VaccHist({ data }: { data: ChartData }) {
  const rows = data.memos.filter(m => m.type === 'vacc').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return (
    <div className="pv">
      <style>{CSS}</style>
      <h4>방종(예방접종)이력</h4>
      <table>
        <thead><tr><th>접종일</th><th>백신</th><th>차수</th><th>접종부위</th><th>비고</th></tr></thead>
        <tbody>
          {rows.map((r, k) => <tr key={k}><td>{r.date}</td><td>{r.name}</td><td>{r.dose}</td><td>{r.site}</td><td>{r.note}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={5} className="none">방종이력이 없어요</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
