import type { ChartData, Row } from './types';

// PDA(바코드/QR) 연동: QR 내용 규칙과 수행 이벤트 적용 (PC와 서버가 같은 함수를 쓴다)
export const patientQr = (id: string) => `NURW|P|${id}`;
export const medQr = (id: string, idx: number, name: string) => `NURW|M|${id}|${idx}|${name.slice(0, 40)}`;
export type Scan = { kind: 'P'; id: string } | { kind: 'M'; id: string; idx: number; name: string } | null;
export function parseQr(s: string): Scan {
  const a = (s || '').trim().split('|');
  if (a[0] !== 'NURW') return null;
  if (a[1] === 'P' && a[2]) return { kind: 'P', id: a[2] };
  if (a[1] === 'M' && a[2] && /^\d+$/.test(a[3] || '')) return { kind: 'M', id: a[2], idx: Number(a[3]), name: a.slice(4).join('|') };
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
export function applyPda(d: ChartData, ev: Row): ChartData {
  const have = d.pda || [];
  if (ev.type !== 'give' || !ev.id || have.some(e => e.id === ev.id)) return d;
  const out: ChartData = { ...d, pda: [...have, ev] };
  const idx = Number(ev.idx);
  const o = d.orders[idx];
  if (!o || (o.name || '') !== ev.name) return out;
  const nums = Object.keys(o).filter(k => /^t\d+$/.test(k) && o[k]).map(k => Number(k.slice(1)));
  const next = `t${(nums.length ? Math.max(...nums) : 0) + 1}`;
  const row: Row = { ...o, ck: '1', [next]: `${ev.time} ${ev.duty}/${ev.by}` };
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
