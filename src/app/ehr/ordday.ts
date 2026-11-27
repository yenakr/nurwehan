import type { ChartData, Row } from './types';

// 처방을 날짜별로 보여 주기 위한 공통 로직 (PC 화면·PDA·샘플 생성이 함께 쓴다)
// 모델: 처방 행(orders)의 t1..tN 도장은 info.slotDay(기록 중인 날)의 수행이고,
//       지난 날의 수행은 mar(투약)·memos 'bdone'(투약 외 간호 수행)에 날짜와 함께 보관한다.

export const SCENARIO_DAY = '2026-11-20';
const ymd = (v?: string) => (v || '').slice(0, 10);
const isDay = (v?: string) => /^\d{4}-\d{2}-\d{2}$/.test(ymd(v));
export const labSec = (s?: string) => /검\s*사/.test(s || '');

export const isMed = (r: Row) => (r.dose || r.route) && !/^check/i.test(r.name || '');
export type Item = { i: number; r: Row; notes: string[] };
// 처방 횟수와 주기로 하루 수행 시각을 만든다
export const slotsOf = (r: Row) => Object.keys(r).filter(k => /^t\d+$/.test(k) && r[k]).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
const hhmm = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;
export function timesFor(r: Row, kind: 'med' | 'base' | 'lab'): string[] {
  const nm = r.name || '';
  const q = /q\s*\[?\s*(\d+)\s*\]?\s*hr/i.exec(nm);
  if (q) { const n = Number(q[1]); if (n >= 1 && n <= 24) { const out: string[] = []; for (let h = 6; h < 30; h += n) out.push(hhmm(h)); return out; } }
  if (kind === 'lab') return ['07:00'];
  const c = Number((/(\d+)\s*회/.exec(r.cnt || '') || [])[1] || '1');
  if (kind === 'base') return /BW|체중|weight/i.test(nm) ? ['07:00'] : ['09:00'];
  const map: Record<number, number[]> = { 1: [9], 2: [9, 21], 3: [9, 13, 18], 4: [9, 13, 17, 21] };
  return (map[c] || map[1]).map(hhmm);
}

export type Groups = { base: Item[]; med: Item[]; prn: Item[]; lab: Item[] };

export function group(orders: Row[]): Groups {
  const g: Groups = { base: [], med: [], prn: [], lab: [] };
  let sec = '';
  let last: Item | null = null;
  orders.forEach((r, i) => {
    if (r.kind === 'sec') { sec = r.name || ''; last = null; return; }
    if (r.kind === 'hid') { last = null; return; }
    if (r.kind === 'memo') { last?.notes.push(r.name || r.text || ''); return; }
    if (!(r.name || '').trim()) return;
    const it: Item = { i, r, notes: [] };
    last = it;
    if (r.kind === 'lab') g.lab.push(it);
    else if (r.pri === 'PRN') g.prn.push(it);
    else if (labSec(sec)) g.lab.push(it);
    else if (isMed(r)) g.med.push(it);
    else g.base.push(it);
  });
  return g;
}

// 처방이 그날 유효한지: 시작일(sd, 없으면 입원일)부터 종료일(ed) 전날까지. 검사 처방은 처방한 그날만.
export function activeOn(o: Row, D: string, admit: string, today: string, lab: boolean): boolean {
  const sd = isDay(o.sd) ? ymd(o.sd) : '';
  if (lab) return D === (sd || today);
  const start = sd || admit;
  if (start && D < start) return false;
  const ed = isDay(o.ed) ? ymd(o.ed) : '';
  if (o.pri === 'D/C') return D <= (ed || today);
  if (ed && D >= ed) return false;
  return true;
}

const dutyOf = (hm: string) => { const h = Number(hm.slice(0, 2)); return h >= 6 && h < 14 ? 'D' : h >= 14 && h < 22 ? 'E' : 'N'; };
const nk = (s?: string) => (s || '').replace(/\s+/g, '').slice(0, 12).toLowerCase();

// 지난·앞으로의 날짜에서 보이는 처방 행: 그날 수행 기록(mar, bdone)을 t1..tN 도장으로 되돌려 준다
function bareOn(o: Row, D: string, d: ChartData): Row {
  const n: Row = { ...o };
  Object.keys(n).forEach(k => { if (/^[tv]\d+$/.test(k)) delete n[k]; });
  delete n.hold;
  n.ck = '';
  n.st = '';
  if (n.pri === 'D/C') n.pri = '';
  const key = nk(o.name);
  const rec: { hm: string; by: string }[] = [];
  d.mar.forEach(m => { if (ymd(m.time) === D && nk(m.name) === key && m.st !== '미수행') rec.push({ hm: (m.time || '').slice(11, 16), by: m.by || '' }); });
  d.memos.forEach(m => { if (m.type === 'bdone' && m.date === D && nk(m.name) === key) rec.push({ hm: m.time || '', by: m.by || '' }); });
  rec.sort((a, b) => a.hm.localeCompare(b.hm));
  rec.forEach((r, i) => { n[`t${i + 1}`] = `${r.hm} ${dutyOf(r.hm)}/${r.by}`; });
  if (rec.length) { n.ck = '1'; if (!isMed(o)) n.st = '완료'; }
  return n;
}

// 조회일(D) 기준 처방 목록. 인덱스는 data.orders와 같고, 해당 없는 행은 kind 'hid'로 바뀐다.
// 지난 날에는 이전 용량·중지된 처방(ordhist)과 그날 시행한 검사를 앞쪽에 덧붙인다(읽기 전용).
export function viewOrders(d: ChartData, D: string, today: string): Row[] {
  const admit = ymd(d.info.admit);
  const slotDay = d.info.slotDay || today;
  let lab = false;
  const out: Row[] = d.orders.map(o => {
    if (o.kind === 'sec') { lab = labSec(o.name); return o; }
    if (o.kind === 'memo' || !(o.name || '').trim()) return o;
    if (!activeOn(o, D, admit, today, lab)) return { kind: 'hid' };
    return D === slotDay ? o : bareOn(o, D, d);
  });
  if (D >= slotDay) return out;
  const extra: Row[] = [];
  d.memos.forEach(m => {
    if (m.type !== 'ordhist') return;
    const sd = ymd(m.sd), ed = ymd(m.ed);
    if (sd && D < sd) return;
    if (ed && D >= ed) return;
    extra.push(bareOn({ name: m.name || '', dose: m.dose || '', unit: m.unit || '', cnt: m.cnt || '', route: m.route || '' }, D, d));
  });
  const md = D.slice(5);
  const names: string[] = [];
  const addLab = (n?: string) => { if (n && !names.includes(n)) names.push(n); };
  d.labs.forEach(l => { if ((l.time || '').slice(0, 5) === md && l.value) addLab(l.name); });
  d.memos.forEach(m => { if (m.type === 'labhist' && (m.time || '').slice(0, 5) === md) addLab(m.name); });
  if (names.length) extra.push({ kind: 'lab', name: names.slice(0, 8).join(', '), st: '완료', cnt: '1회' });
  return [...extra, ...out];
}

// 날짜가 바뀌면(가상 시계 포함) 그날의 수행 도장을 기록으로 옮기고 새 날을 비운다
export function rollover(d: ChartData, today: string): ChartData {
  const sdy = d.info.slotDay;
  if (!sdy || sdy >= today) return d;
  const mar = [...d.mar];
  const memos = [...d.memos];
  let lab = false;
  const orders = d.orders.map(o => {
    if (o.kind === 'sec') { lab = labSec(o.name); return o; }
    if (o.kind === 'memo' || !(o.name || '').trim() || lab) return o;
    const st = slotsOf(o);
    if (!st.length && !o.ck) return o;
    const med = !!isMed(o);
    const times = timesFor(o, med ? 'med' : 'base');
    st.forEach((k, idx) => {
      const m = /^(\d{2}:\d{2})\s*(?:[A-Z]\/)?(.*)$/.exec(o[k] || '');
      if (!m) return;
      const by = (m[2] || '').replace(/^\//, '');
      if (med) mar.push({ time: `${sdy} ${m[1]}`, name: o.name || '', dose: `${o.dose || ''}${o.unit || ''}`, route: o.route || '', slot: times[idx] || '', by, wb: '확인', ...((o.ua || '').split(',').includes(k) ? { ua: '1' } : {}) });
      else memos.push({ type: 'bdone', date: sdy, name: o.name || '', time: m[1], by });
    });
    const n: Row = { ...o, ck: '' };
    Object.keys(n).forEach(k => { if (/^[tv]\d+$/.test(k)) delete n[k]; });
    delete n.hold;
    delete n.ua;
    if (!med && n.st === '완료') n.st = '';
    return n;
  });
  return { ...d, orders, mar, memos, info: { ...d.info, slotDay: today } };
}
