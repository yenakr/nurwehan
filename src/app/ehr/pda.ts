import type { ChartData, Row } from './types';
import { rollover } from './ordday';

// PDA(바코드/QR) 연동: QR 내용 규칙과 수행 이벤트 적용 (PC와 서버가 같은 함수를 쓴다)
export const patientQr = (id: string) => `NURW|P|${id}`;
export const medQr = (id: string, idx: number, name: string) => `NURW|M|${id}|${idx}|${name.slice(0, 40)}`;
export const specQr = (id: string, idx: number, name: string) => `NURW|S|${id}|${idx}|${name.slice(0, 40)}`;
export const bloodQr = (id: string, idx: number, name: string) => `NURW|B|${id}|${idx}|${name.slice(0, 40)}`;
// 혈액번호는 처방 위치로 정해 같은 처방은 항상 같은 번호가 나온다 (연습용)
export const bagNo = (idx: number) => `2026-${String(118000 + idx * 37).padStart(6, '0')}`;
export type Scan = { kind: 'P'; id: string } | { kind: 'M' | 'S' | 'B'; id: string; idx: number; name: string } | null;
export function parseQr(s: string): Scan {
  const a = (s || '').trim().split('|');
  if (a[0] !== 'NURW') return null;
  if (a[1] === 'P' && a[2]) return { kind: 'P', id: a[2] };
  if ((a[1] === 'M' || a[1] === 'S' || a[1] === 'B') && a[2] && /^\d+$/.test(a[3] || '')) return { kind: a[1], id: a[2], idx: Number(a[3]), name: a.slice(4).join('|') };
  return null;
}

export const isMedRow = (r: Row) => !!(r.dose || r.route) && !/^check/i.test(r.name || '');
export function ivMlOf(r: Row): number {
  if (!isMedRow(r) || !/^(IV|CIV|IVF|IV-?DRIP)$/i.test((r.route || '').trim())) return 0;
  const amt = parseFloat(r.dose || '');
  const u = (r.unit || '').trim();
  return Number.isNaN(amt) ? 0 : /^l$/i.test(u) ? amt * 1000 : /^(ml|cc)$/i.test(u) ? amt : 0;
}

// ev: { id, type:'give', idx, name, date:'YYYY-MM-DD', time:'HH:MM', duty, by }
export const isBloodName = (n: string) => /prbc|packed|ffp|platelet|\bplt\b|혈소판|적혈구|혈장|수혈|whole blood/i.test(n);
const nearHour = (date: string, time: string) => {
  const m = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const h = Math.round(m / 60);
  return Math.abs(h * 60 - m) <= 99 && h < 24 ? `${date} ${String(h).padStart(2, '0')}:00` : `${date} ${time}`;
};
export function applyPda(d0: ChartData, ev: Row): ChartData {
  const have = d0.pda || [];
  if (!['give', 'spec', 'blood', 'vit'].includes(ev.type) || !ev.id || have.some(e => e.id === ev.id)) return d0;
  if (ev.type !== 'give') {
    const d = rollover(d0.info.slotDay ? d0 : { ...d0, info: { ...d0.info, slotDay: ev.date } }, ev.date);
    const out: ChartData = { ...d, pda: [...have, ev] };
    const at = `${ev.date} ${ev.time}`;
    if (ev.type === 'spec') {
      const o = d.orders[Number(ev.idx)];
      if (o && (o.name || '') === ev.name) out.orders = d.orders.map((r, i) => (i === Number(ev.idx) ? { ...r, st: '채취', spc: `${ev.time} ${ev.duty}/${ev.by}` } : r));
      out.specimen = [...d.specimen, { time: at, test: ev.name, tube: '', st: '채취', by: ev.by, src: 'PDA' }];
    } else if (ev.type === 'blood') {
      const base = { blood: ev.name, bno: ev.bno, bp: '', pr: '', rr: '', bt: '' };
      out.transfusion = [...d.transfusion, { time: at, step: '확인', ...base, note: `2인 확인 완료: ${ev.by}, ${ev.cosign} (PDA)` }, { time: at, step: '시작', ...base, note: '' }];
      out.notes = [...d.notes, { time: at, focus: '수혈', text: `D)\n${ev.name} (${ev.bno}) 수혈 시작함. 2인 확인(${ev.by}, ${ev.cosign}).\n(PDA 바코드 확인)`, author: ev.by, shift: ev.duty }];
    } else {
      const bp = ev.sbp && ev.dbp ? `${ev.sbp}/${ev.dbp}` : '';
      out.vitals = [...d.vitals, { time: nearHour(ev.date, ev.time), at, bp, sbp: ev.sbp || '', dbp: ev.dbp || '', hr: ev.hr || '', rr: ev.rr || '', bt: ev.bt || '', spo2: ev.spo2 || '', pain: '', auth: '미인증', by: ev.by }];
    }
    return out;
  }
  const d = rollover(d0.info.slotDay ? d0 : { ...d0, info: { ...d0.info, slotDay: ev.date } }, ev.date);
  const out: ChartData = { ...d, pda: [...have, ev] };
  const idx = Number(ev.idx);
  const o = d.orders[idx];
  if (!o || (o.name || '') !== ev.name) return out;
  const nums = Object.keys(o).filter(k => /^t\d+$/.test(k) && o[k]).map(k => Number(k.slice(1)));
  const next = `t${(nums.length ? Math.max(...nums) : 0) + 1}`;
  const row: Row = { ...o, ck: '1', [next]: `${ev.time} ${ev.duty}/${ev.by}`, ua: [...(o.ua || '').split(',').filter(Boolean), next].join(',') }; // ua: 미인증 서명(PDA 액팅) — PC에서 인증해야 확정
  if (!isMedRow(o)) row.st = '완료';
  out.orders = d.orders.map((r, i) => (i === idx ? row : r));
  const ml = ivMlOf(o);
  if (ml > 0) {
    const hh = ev.time.slice(0, 2);
    const cur = d.memos.find(m => m.type === 'flow' && m.date === ev.date && m.item === 'IV (mL)' && m.hour === hh);
    const rest = d.memos.filter(m => m !== cur);
    out.memos = [...rest, { type: 'flow', date: ev.date, item: 'IV (mL)', hour: hh, text: String((Number(cur?.text) || 0) + ml), author: ev.by }];
  }
  out.notes = [...d.notes, { time: `${ev.date} ${ev.time}`, focus: '투약', text: `${o.name}${o.dose ? ` ${o.dose}${o.unit || ''}` : ''}${o.route ? ` ${o.route}` : ''} 투약함\n(PDA 바코드 확인: 환자·약·용량·경로·시간)`, author: ev.by, shift: ev.duty }];
  return out;
}
