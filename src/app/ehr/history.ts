import type { Row } from './types';
import { SCENARIO_DAY, activeOn, isMed, labSec, timesFor } from './ordday';
import { ivMlOf } from './pda';

// 입원일부터 가상 오늘(SCENARIO_DAY) 전날까지의 일별 기록을 만든다.
// 이미 사례에 직접 쓴 기록(활력징후·투약·I&O·기록)은 그대로 두고, 비어 있는 날·시각만 채운다.

const hs = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pad = (n: number) => String(n).padStart(2, '0');
const utc = (D: string) => { const [y, m, d] = D.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fmt = (t: number) => { const x = new Date(t); return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`; };
const addDay = (D: string, n: number) => fmt(utc(D) + n * 86400000);
const mm = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hmOf = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const nurse = (hm: string) => { const h = Number(hm.slice(0, 2)); return h >= 6 && h < 14 ? '박간호' : h >= 14 && h < 22 ? '최간호' : '김간호'; };
const nk = (s?: string) => (s || '').replace(/\s+/g, '').slice(0, 12).toLowerCase();
const ymd = (v?: string) => (v || '').slice(0, 10);

// 사례별로 빠진 날의 간호기록·경과기록 (MM-DD 기준)
const NOTES: Record<string, [string, string, string, string, string][]> = {
  // [MM-DD, HH:MM, 간호초점, 본문, 근무]
  adult: [
    ['11-16', '14:40', '입원 간호정보', 'D)\n호흡곤란과 하지 부종으로 외래 경유 입원. 입원 시 BP 152/94, HR 112, RR 26, SpO2 89% (room air), 체중 64.0kg, 양하지 pitting edema 2+. 기좌호흡 호소.\n\nA)\n체액과다, 낙상 위험(Morse 60점) 확인. 반좌위 유지하고 O2 2L/min NC 적용함.\n\nR)\nSpO2 94%로 상승, 입원생활 안내 및 호출벨 사용법 설명 후 이해함. 보호자 상주 요청함.', 'E'],
    ['11-17', '10:00', '체액과다', 'S)\n"어제보다 숨이 덜 차요."\n\nO)\nBP 140/88, HR 96, SpO2 94% (2L NC). 체중 63.1kg, 전일 I/O -1,250mL. 하지 부종 2+→1+.\n\nA)\n이뇨제 IV 투여 후 소변량 증가, 체액과다 호전 중.\n\nI)\nstrict I&O 및 매일 체중 측정 시행, 수분 1,000mL 제한·저염식 교육함.\n\nE)\n환자가 수분 제한 이유를 설명함.', 'D'],
    ['11-18', '09:30', '활동 지속성 장애', 'S)\n"화장실 갈 때 숨이 차요."\n\nO)\nBP 136/84, HR 92, 보행 후 SpO2 92%→휴식 5분 후 95%. 체중 62.4kg.\n\nA)\n활동 시 호흡곤란, 낙상 위험 지속.\n\nI)\n보행 시 호출 교육, 활동 중간 휴식 격려, Foley 제거 전 소변량 확인.\n\nE)\n환자가 휴식 후 이동하겠다고 함.', 'D'],
  ],
  child: [
    ['11-17', '19:30', '입원 간호정보', 'D)\n3일 전부터 기침·콧물, 어제부터 수유량 감소로 내원. 입원 시 BT 38.0, HR 168, RR 58, SpO2 91% (room air). 흉곽 함몰 경미. 접촉·비말 격리 시행, 보호자에게 격리 방법 설명함.\n\nA)\n비효율적 기도청결, 체온상승 우려.\n\nI)\n산소 적용, 비강 흡인, 수액 시작.\n\nR)\nSpO2 95%로 상승, 보호자가 격리 수칙을 말함.', 'E'],
  ],
  women: [
    ['11-18', '15:30', '입원 간호정보 및 수술 전 간호', 'D)\n재제왕절개 예정(내일)으로 입원. 임신 38주, 태동 양호, 규칙적 진통 없음. FHR 140bpm, BP 112/70.\n\nA)\n수술 전 준비 필요.\n\nI)\n자정부터 금식, 수술 동의서·수술 전 확인표 점검, 수술 부위 피부 준비 및 수술 전 교육 시행함.\n\nE)\n환자가 수술 후 조기 보행과 호흡 운동 방법을 설명함.', 'E'],
  ],
  psych: [
    ['11-15', '16:30', '입원 간호정보', 'D)\n환청과 피해망상, 수면 감소로 보호입원. 입원 시 폐쇄병동 규칙 설명, 소지품 점검(위험물 없음). 병식 없음, 면담 시 경계적 태도.\n\nA)\n안전 위험도 평가: 자해·타해 위험 낮음~중등도, 15분 관찰.\n\nI)\n안정적 환경 제공, 약물 복용 시 구강 확인.\n\nR)\n불안정하나 병동 규칙에 동의함.', 'E'],
    ['11-16', '10:00', '환청', 'S)\n"누가 계속 말을 걸어요."\n\nO)\nBP 126/80, HR 90. 수면 4시간. 혼잣말 간헐적, 식사 50% 섭취.\n\nA)\n환청 지속, 불면.\n\nI)\n처방 약 복용 확인, 지지적 면담, 자극 줄이기.\n\nE)\n약 복용 거부 없음.', 'D'],
    ['11-19', '10:00', '환청', 'S)\n"소리가 어제보다는 줄었어요."\n\nO)\nBP 124/78, HR 84. 수면 5시간, 식사 80%. 약 복용 잘 함.\n\nA)\n증상 호전 중, 병식 부족.\n\nI)\n복약 이유 설명, 치료 순응 격려.\n\nE)\n약 복용 후 삼킴 확인함.', 'D'],
  ],
  gi: [
    ['11-18', '17:30', '출혈', 'D)\n토혈·흑색변으로 응급 내시경 후 입원. 십이지장 궤양 Forrest Ib 지혈술 시행. 입원 시 BP 98/60, HR 118, 어지럼 호소.\n\nA)\n체액량 부족 위험.\n\nI)\n금식, 2회선 IV 유지, 2시간마다 V/S 측정, 흑색변·토혈 관찰 및 I&O 기록.\n\nR)\nBP 102/62로 호전, 어지럼 감소.', 'E'],
  ],
  pul: [
    ['11-17', '16:30', '입원 간호정보', 'D)\n발열·기침·가래·호흡곤란으로 응급실 경유 입원. 입원 시 BT 38.6, HR 112, SpO2 90% (room air). COPD 과거력. 비말 격리 시행.\n\nA)\n비효율적 기도청결, 고체온.\n\nI)\n산소 2L NC(목표 SpO2 88~92%), 가래 배출 격려, 혈액·객담 배양 채취함.\n\nR)\nSpO2 92%로 상승.', 'E'],
  ],
  os: [
    ['11-18', '15:00', '입원 간호정보 및 수술 전 간호', 'D)\nRt. TKA 예정(내일)으로 입원. 보행 시 Rt. 무릎 통증 NRS 4, 보행기 사용. BP 120/74.\n\nA)\n수술 전 준비 필요, 낙상 위험.\n\nI)\n자정부터 금식, 수술 부위 피부 준비, 수술 전 확인표 점검, 수술 후 CPM·조기 보행 교육함.\n\nE)\n환자가 수술 후 호흡 운동과 발목 운동을 시범함.', 'E'],
  ],
};
const PROG: Record<string, [string, string, string][]> = {
  // [MM-DD, HH:MM, 본문]
  adult: [['11-18', '09:50', 'S) 숨찬 것 조금 더 나아짐.\nO) BP 136/84, HR 92, SpO2 95% (2L NC), I/O -900mL, 체중 62.4kg.\nA) ADHF 호전 중\nP) 이뇨제 유지, 내일부터 경구 전환 고려, 전해질 f/u.']],
  child: [['11-18', '10:00', 'S) 기침 지속, 수유량 소폭 증가.\nO) BT 37.6, HR 158, RR 50, SpO2 94% (O2 1L), 흉곽 함몰 경미.\nA) RSV 세기관지염, 경과 관찰\nP) 산소·흡인 유지, 수액 유지, 3% NaCl 분무 고려.']],
  women: [['11-18', '16:30', '입원 시 평가: 38주, 태동 양호, 진통 없음. 반복 제왕절개 예정(11/19). 수술 전 검사 결과 확인, 수술 동의서 설명 완료. NPO after MN.']],
  psych: [
    ['11-16', '10:30', 'S) "누가 말을 걸어요." 수면 4시간.\nO) 혼잣말 간헐적, 병식 없음, 약 복용 순응.\nA) 조현병 급성 악화\nP) Risperidone 유지, 안전 관찰.'],
    ['11-17', '10:30', 'S) 불안·초조 호소. 밤에 불안 심함.\nO) 오전 안정, 환청 지속.\nA) 증상 지속\nP) 약물 용량 조정 고려, 필요시 lorazepam.'],
    ['11-19', '10:20', 'S) "소리가 줄었어요." 수면 5시간.\nO) 식사 80%, 약 복용 순응, 병식 부족.\nA) 호전 중\nP) Risperidone 증량 유지, 부작용 모니터링.'],
  ],
  pul: [['11-17', '17:00', '입원 시 평가: 발열·기침·호흡곤란. BT 38.6, SpO2 90% (RA). CXR 우하엽 침윤, Influenza A (+). Ceftriaxone·azithromycin·oseltamivir 시작, 비말 격리, O2 2L NC.']],
  os: [['11-18', '16:00', '입원: Rt. 무릎 골관절염으로 TKA 예정(11/19). 수술 전 검사·마취 평가 완료, 수술 동의서 설명함. NPO after MN.']],
};

type Anchor = { t: number; r: Row; sbp: number; dbp: number };
const tsOf = (time: string): number => {
  const m = /^(?:(\d{4})-)?(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(time || '');
  return m ? Date.UTC(Number(m[1] || 2026), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) : NaN;
};

export type HistIn = { key: string; info: Record<string, string>; orders: Row[]; memos: Row[]; vitals: Row[]; io: Row[]; notes: Row[]; progress: Row[]; mar: Row[]; surgery: Row[] };
export type HistOut = { orders: Row[]; memos: Row[]; vitals: Row[]; io: Row[]; notes: Row[]; progress: Row[]; mar: Row[]; info: Record<string, string> };

const PREOP: Record<string, string[]> = {
  os: ['NPO after midnight (수술 전 금식)', 'Skin prep (Rt. 무릎 수술 부위)', 'Pre-op 확인표 점검'],
  women: ['NPO after midnight (수술 전 금식)', 'Skin prep (복부)', 'Pre-op 확인표 점검'],
};
const POSTOP: Record<string, RegExp> = {
  os: /cefazolin|acetaminophen|hemovac|neurovascular|거상|CPM|walker|elastic|enoxaparin|ketorolac|tramadol|morphine|celecoxib|prbc|knee x-ray/i,
  women: /cefazolin|acetaminophen|docusate|fundal|early ambul|foley catheter rem|oxytocin|ketorolac|tramadol|rooming/i,
  gs: /cefazolin|acetaminophen|op site|early ambul|incentive|ketorolac|tramadol/i,
};

export function buildHistory(h: HistIn): HistOut {
  const today = SCENARIO_DAY;
  const admit = ymd(h.info.admit);
  const surgDay = ymd(h.surgery[0]?.date);
  const mar = [...h.mar];
  const memos = [...h.memos];
  const out: HistOut = { orders: h.orders, memos, vitals: [...h.vitals], io: [...h.io], notes: [...h.notes], progress: [...h.progress], mar, info: { ...h.info, orderDate: today, slotDay: today } };
  if (!admit || admit >= today) return out;

  // 처방 시작·종료일: 수술 후 처방은 수술일부터, D/C 처방은 같은 약의 새 처방이 시작되는 날 종료
  // 사례별 처방 기간 (서술에 맞게 직접 지정)
  const FIX: Record<string, { test: (o: Row) => boolean; set: Row }[]> = {
    adult: [
      { test: o => /^furosemide 20mg/i.test(o.name || '') && o.pri === 'D/C', set: { ed: '2026-11-17' } },
      { test: o => /^furosemide 40mg/i.test(o.name || ''), set: { sd: '2026-11-17' } },
    ],
  };
  let orders = h.orders.map(o => (o.kind === 'sec' || o.kind === 'memo' || !o.name ? o : o.pri === 'STAT' && !o.sd ? { ...o, sd: today } : (FIX[h.key] || []).reduce((a, f) => (f.test(a) ? { ...a, ...f.set } : a), o)));
  orders = orders.map(o => (o.kind === 'sec' || o.kind === 'memo' || !o.name || o.sd ? o : surgDay && POSTOP[h.key]?.test(o.name) ? { ...o, sd: surgDay } : o));
  orders = orders.map(o => {
    if (o.pri !== 'D/C' || o.ed || !o.name) return o;
    const w = o.name.split(/[\s(]/)[0].toLowerCase();
    const nx = orders.find(x => x !== o && x.name && x.pri !== 'D/C' && x.sd && x.name.toLowerCase().startsWith(w));
    return nx ? { ...o, ed: nx.sd } : o;
  });
  out.orders = orders;
  if (surgDay && surgDay > admit && PREOP[h.key] && !memos.some(m => m.type === 'ordhist' && m.ed === surgDay)) {
    PREOP[h.key].forEach(name => memos.push({ type: 'ordhist', name, dose: '', unit: '', cnt: '', route: '', sd: admit, ed: surgDay }));
  }

  // 도착 시각: 입원일의 가장 이른 기록
  const early: number[] = [];
  [h.vitals, h.notes, h.progress].forEach(l => l.forEach(r => { const t = tsOf(r.time || ''); if (!Number.isNaN(t) && fmt(t) === admit) early.push(Math.floor((t % 86400000) / 60000)); }));
  const md0 = admit.slice(5);
  (NOTES[h.key] || []).forEach(([d, t]) => { if (d === md0) early.push(mm(t)); });
  (PROG[h.key] || []).forEach(([d, t]) => { if (d === md0) early.push(mm(t)); });
  const arrive = early.length ? Math.min(...early) : 10 * 60;

  // 1) 투약·간호 수행 기록 (처방 × 날짜 × 시각)
  type P = { o: Row; from: string; to: string };
  const pool: P[] = [];
  let lab = false;
  orders.forEach(o => {
    if (o.kind === 'sec') { lab = labSec(o.name); return; }
    if (o.kind === 'memo' || o.kind === 'lab' || !(o.name || '').trim() || lab || /^※/.test(o.name || '')) return;
    if (o.pri === 'PRN' || o.pri === 'STAT' || o.st === '추가') return;
    pool.push({ o, from: '', to: '' });
  });
  // 알레르기·위험 때문에 D/C한 처방은 투여하지 않은 것으로 본다
  const skipDc = new Set<Row>();
  orders.forEach((o, i) => {
    if (o.pri !== 'D/C') return;
    for (let j = i + 1; j < orders.length && orders[j].kind === 'memo'; j++) if (/알레르기|위험|금기/.test(orders[j].name || '')) skipDc.add(o);
  });
  memos.filter(m => m.type === 'ordhist').forEach(m => pool.push({ o: { name: m.name || '', dose: m.dose || '', unit: m.unit || '', cnt: m.cnt || '', route: m.route || '', sd: m.sd || '', ed: m.ed || '' }, from: m.sd || '', to: m.ed || '' }));
  const have = new Set(mar.map(m => `${ymd(m.time)}|${nk(m.name)}|${m.slot}`));
  const haveB = new Set(memos.filter(m => m.type === 'bdone').map(m => `${m.date}|${nk(m.name)}|${m.time}`));
  const flow = new Map<string, number>();
  for (let D = admit; D < today; D = addDay(D, 1)) {
    pool.forEach(({ o, from, to }) => {
      if (skipDc.has(o)) return;
      if (from) { if (D < from || (to && D >= to)) return; } else if (!activeOn(o, D, admit, today, false)) return;
      const med = !!isMed(o);
      timesFor(o, med ? 'med' : 'base').forEach((slot, k) => {
        if (D === admit && mm(slot) < arrive + 30) return;
        const off = hs(`${o.name}${D}${slot}`) % 10;
        const at = hmOf(mm(slot) + off);
        const by = nurse(slot);
        if (med) {
          if (have.has(`${D}|${nk(o.name)}|${slot}`)) return;
          mar.push({ time: `${D} ${at}`, name: o.name || '', dose: `${o.dose || ''}${o.unit || ''}`, route: o.route || '', slot, by, wb: '확인' });
          const ml = ivMlOf(o);
          if (ml > 0) { const key = `${D}|${slot.slice(0, 2)}`; flow.set(key, (flow.get(key) || 0) + ml); }
        } else {
          if (haveB.has(`${D}|${nk(o.name)}|${at}`)) return;
          memos.push({ type: 'bdone', date: D, name: o.name || '', time: at, by });
        }
        void k;
      });
    });
  }
  flow.forEach((ml, key) => { const [date, hour] = key.split('|'); if (!memos.some(m => m.type === 'flow' && m.date === date && m.item === 'IV (mL)' && m.hour === hour)) memos.push({ type: 'flow', date, item: 'IV (mL)', hour, text: String(ml), author: nurse(`${hour}:00`) }); });
  mar.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  // 2) 활력징후: Check V/S 처방 주기대로, 실제 측정값 사이를 이어서 채운다
  const vs = orders.find(o => /^check\s*v\/?s/i.test(o.name || ''));
  if (vs) {
    const anchors: Anchor[] = h.vitals.map(r => { const [s, d] = (r.bp || '').split('/').map(Number); return { t: tsOf(r.time), r, sbp: s || 0, dbp: d || 0 }; }).filter(a => !Number.isNaN(a.t)).sort((a, b) => a.t - b.t);
    if (anchors.length) {
      for (let D = admit; D < today; D = addDay(D, 1)) {
        timesFor(vs, 'base').forEach(slot => {
          if (D === admit && mm(slot) < arrive + 30) return;
          const t = utc(D) + mm(slot) * 60000;
          if (anchors.some(a => Math.abs(a.t - t) < 75 * 60000)) return;
          const prev = [...anchors].reverse().find(a => a.t < t);
          const next = anchors.find(a => a.t > t);
          const z = hs(`${h.key}${D}${slot}`);
          const j = (n: number, amp: number) => (((z >>> n) % 7) - 3) / 3 * amp;
          const lerp = (f: (a: Anchor) => number) => (prev && next ? f(prev) + (f(next) - f(prev)) * ((t - prev.t) / (next.t - prev.t)) : f((prev || next)!));
          const pre = !!surgDay && (D < surgDay || (D === surgDay && t < anchors[0].t));
          const bt = pre ? Math.min(lerp(a => Number(a.r.bt) || 36.6), 36.8) : lerp(a => Number(a.r.bt) || 36.6);
          const pain = pre ? 0 : Math.max(0, Math.round(lerp(a => Number(a.r.pain) || 0)));
          const sp = lerp(a => Number(a.r.spo2) || 0);
          const sbp = Math.round(lerp(a => a.sbp) + j(0, 4)), dbp = Math.round(lerp(a => a.dbp) + j(3, 3));
          out.vitals.push({ time: `${D.slice(5)} ${slot}`, bp: `${sbp}/${dbp}`, hr: String(Math.round(lerp(a => Number(a.r.hr) || 80) + j(5, 3))), rr: String(Math.round(lerp(a => Number(a.r.rr) || 16))), bt: (Math.round((bt + j(7, 0.15)) * 10) / 10).toFixed(1), spo2: sp ? String(Math.min(100, Math.round(sp + j(2, 1)))) : '', pain: String(pain) });
        });
      }
      out.vitals.sort((a, b) => tsOf(a.time) - tsOf(b.time));
    }
  }

  // 3) I&O: 사례의 기록 방식(하루 합계 / 근무조별)에 맞춰 빠진 칸을 채운다. N은 그날 22시에 시작하는 야간 근무.
  out.io = out.io.map(r => (r.time === `${today} N` ? { ...r, time: `${addDay(today, -1)} N` } : r));
  const hasIO = out.io.length > 0 || orders.some(o => /^check\s*i\/?o/i.test(o.name || ''));
  if (hasIO) {
    const num = (s: string, lab2: string) => { const m = new RegExp(`${lab2}\\s*([\\d,]+)`).exec(s || ''); return m ? Number(m[1].replace(/,/g, '')) : 0; };
    const dates = out.io.map(r => ymd(r.time));
    const perDay = out.io.length > 0 && new Set(dates).size === dates.length;
    const med = (f: (r: Row) => number) => { const v = out.io.map(f).filter(x => x > 0).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : 0; };
    const po = med(r => num(r.intake, 'PO')), iv = med(r => num(r.intake, 'IV')), ur = med(r => num(r.output, '소변'));
    const exist = new Set(out.io.map(r => r.time));
    const c = (n: number) => n.toLocaleString('en-US');
    const put = (D: string, sh: string, k: number, f: number, post: boolean, npo: boolean) => {
      if (exist.has(`${D} ${sh}`)) return;
      const z = hs(`${h.key}${D}${sh}`);
      const rnd = (v: number) => Math.round((v * f * (1 + (((z >>> k) % 9) - 4) * 0.03)) / 10) * 10;
      const P = po ? rnd(po) : out.io.length ? 0 : rnd(perDay ? 900 : 400), V = post && iv ? rnd(iv) : npo ? rnd(500) : 0, U = ur ? rnd(ur) : rnd(perDay ? 1300 : 500);
      out.io.push({ time: `${D} ${sh}`, intake: npo ? `금식 / IV ${c(V)}` : [P ? `PO ${c(P)}` : '', V ? `IV ${c(V)}` : ''].filter(Boolean).join(' / ') || '금식', output: `소변 ${c(U)}`, note: '' });
    };
    const SH: [string, number, number, number][] = [['D', 360, 1.1, 4], ['E', 840, 0.9, 6], ['N', 1320, 0.7, 2]];
    for (let D = admit; D < today; D = addDay(D, 1)) {
      const post = !(surgDay && D <= surgDay);
      if (perDay) { if (D > admit) put(D, 'D', 1, 1, post, false); continue; }
      SH.forEach(([sh, st, f, k]) => { if (D === admit && arrive > st + 240) return; put(D, sh, k, f, post, !!surgDay && D === surgDay && sh === 'D'); });
    }
    const ord = (r: Row) => `${ymd(r.time)}${({ N: 0, D: 1, E: 2 } as Record<string, number>)[(r.time || '').slice(11)] ?? 3}`;
    out.io.sort((a, b) => ord(a).localeCompare(ord(b)));
  }

  // 4) 간호기록·경과기록: 빠진 날
  (NOTES[h.key] || []).forEach(([d, t, focus, text, shift]) => {
    if (out.notes.some(n => (n.time || '').includes(d) && n.focus === focus)) return;
    out.notes.push({ time: `${d} ${t}`, focus, text, author: shift === 'E' ? '최간호' : '박간호', shift });
  });
  (PROG[h.key] || []).forEach(([d, t, text]) => {
    if (out.progress.some(p => ymd(p.time) === `2026-${d}`)) return;
    out.progress.push({ time: `2026-${d} ${t}`, dept: h.info.dept || '', text, author: h.info.doctor || '' });
  });
  const dk = (r: Row) => (r.time || '').replace(/^(\d{2}-)/, '2026-$1');
  out.notes.sort((a, b) => dk(b).localeCompare(dk(a)));
  out.progress.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  return out;
}
