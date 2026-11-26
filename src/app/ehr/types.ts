import { SCENARIO_DAY } from './ordday';
export type Row = Record<string, string>;

export type ChartData = {
  info: Record<string, string>;
  progress: Row[]; // 경과기록
  orders: Row[]; // 의사처방 (kind: '' | 'sec' | 'memo')
  vitals: Row[]; // 임상관찰
  io: Row[];
  bst: Row[]; // 혈당·인슐린
  diet: Row[]; // 식이
  dxcode: Row[]; // 상병코드
  nact: Row[]; // 간호행위
  mat: Row[]; // 처치재료
  dietord: Row[]; // 식이처방
  ret: Row[]; // 약·주사 반납
  dcmed: Row[]; // 퇴원약
  dcnote: Row[]; // 퇴원예고
  sched: Row[]; // 당일 일정
  acu: Row[]; // 중증도·고위험
  docs: Row[]; // 간호 서식지
  labs: Row[]; // 검사결과
  notes: Row[]; // 간호기록
  care: Row[]; // 간호과정
  transfusion: Row[]; // 수혈기록
  nutrition: Row[]; // 영양기록
  consult: Row[]; // 협진기록
  consent: Row[]; // 동의서
  surgery: Row[]; // 수술기록
  appts: Row[]; // 외래예약
  handover: Row[]; // 인계(SBAR)
  risk: Row[]; // 위험도평가
  history: Row[]; // 상병이력
  imaging: Row[]; // 영상검사
  memos: Row[]; // 간호·진료 메모, 인수인계
  mar: Row[]; // 투약 수행 기록
  lines: Row[]; // 튜브·라인·배액관
  iv: Row[]; // IV 수액 속도·잔량
  wounds: Row[]; // 상처·드레싱
  edu: Row[]; // 환자 교육
  specimen: Row[]; // 검체 채취
  transport: Row[]; // 이송 의뢰
  moves: Row[]; // 전동·전과·외출·외박
  cpr: Row[]; // 응급 CPR
  anes: Row[]; // 마취기록
  pda: Row[]; // PDA 수행 이벤트(기기 간 동기화)
  forms: Record<string, Row[]>; // 평가도구(낙상·욕창·통증·수술 전 확인)
};

const LISTS = ['progress', 'orders', 'vitals', 'io', 'bst', 'diet', 'dxcode', 'nact', 'mat', 'dietord', 'ret', 'dcmed', 'dcnote', 'sched', 'acu', 'docs', 'labs', 'notes', 'care', 'transfusion', 'nutrition', 'consult', 'consent', 'surgery', 'appts', 'handover', 'risk', 'history', 'imaging', 'memos', 'mar', 'lines', 'iv', 'wounds', 'edu', 'specimen', 'transport', 'moves', 'cpr', 'anes', 'pda'] as const;

export const emptyChart = (): ChartData => {
  const d: Record<string, unknown> = { info: {}, forms: {} };
  LISTS.forEach(k => (d[k] = []));
  return d as ChartData;
};

export type Sample = { key: string; subject: string; title: string; data: Partial<ChartData> & { info: Record<string, string> } };

// 미래 일정을 담는 항목은 기준일 계산에서 뺀다
const FUTURE = new Set(['appts', 'chg', 'disDate']);
// 샘플 차트는 모두 같은 가상 날짜(SCENARIO_DAY)에 고정한다. 날짜는 옮기지 않고, 가상 시계만 그날 마지막 기록 직후로 정해 준다.
// 외래·응급 환자는 진료 시각이 입원 환자와 다르므로, 시계는 환자마다 그날의 마지막 기록 시각을 따른다.
export function shiftChart(src: ChartData): ChartData {
  const day = SCENARIO_DAY;
  const md = day.slice(5);
  let last = -1;
  const scan = (v: unknown) => {
    if (typeof v === 'string') {
      const m = v.match(/(?:^|\s)(?:\d{4}-)?(\d{2}-\d{2}) (\d{2}):(\d{2})/);
      if (m && m[1] === md) last = Math.max(last, Number(m[2]) * 60 + Number(m[3]));
    } else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => !FUTURE.has(k) && scan(x));
  };
  // 이미 일어난 일의 기록만 본다 (예정된 교육·이송·검체 등은 제외)
  ['vitals', 'notes', 'progress', 'mar', 'nact', 'mat', 'wounds', 'lines', 'iv', 'bst', 'transfusion', 'cpr', 'anes', 'handover', 'memos'].forEach(k => scan((src as unknown as Record<string, unknown>)[k]));
  const at = last < 0 ? 9 * 60 : Math.min(23 * 60 + 55, Math.ceil((last + 10) / 5) * 5);
  const hm = `${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}`;
  return { ...src, info: { ...src.info, vbase: src.info.vbase || `${day} ${hm}`, slotDay: src.info.slotDay || day } };
}

// 예전 형식으로 저장된 차트도 열리도록 변환
// 혈압은 수축기(sbp)·이완기(dbp)를 따로 저장하고, 호환용 bp("120/80")도 같이 맞춘다.
export function withBp(r: Row): Row {
  const [s0, d0] = (r.bp || '').split('/');
  const sbp = r.sbp ?? (s0 || '');
  const dbp = r.dbp ?? (d0 || '');
  return { ...r, sbp, dbp, bp: sbp || dbp ? `${sbp}/${dbp}` : '' };
}

export function migrate(raw: unknown): ChartData {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = emptyChart() as unknown as Record<string, unknown>;
  LISTS.forEach(k => {
    if (Array.isArray(r[k])) base[k] = r[k];
  });
  const info: Record<string, string> = { ...((r.info as Record<string, string>) || {}) };
  if (info.ptNo && info.ptNo.length > 4) info.ptNo = info.ptNo.slice(-4); // 환자번호는 4자리
  if (info.history && !info.pmh) info.pmh = info.history;
  if (info.orders && !info.plan) info.plan = info.orders;
  const out = base as unknown as ChartData;
  out.vitals = (out.vitals || []).map(withBp);
  out.info = info;
  out.forms = r.forms && typeof r.forms === 'object' && !Array.isArray(r.forms) ? (r.forms as Record<string, Row[]>) : {};

  const meds = Array.isArray(r.meds) ? (r.meds as Row[]) : [];
  if (out.orders.length === 0 && meds.length > 0) {
    out.orders = [
      { kind: 'sec', name: '▶ 투약 ◀' },
      ...meds.map(m => ({ name: m.drug || '', dose: m.dose || '', route: m.route || '', ck: m.done ? '1' : '', t1: m.time || '', st: '', memo: m.note || '' })),
    ];
  }
  out.notes = out.notes.map(n =>
    n.text !== undefined || (!n.d && !n.a && !n.r)
      ? n
      : { time: n.time || '', focus: n.focus || '', text: [n.d && `D)\n${n.d}`, n.a && `A)\n${n.a}`, n.r && `R)\n${n.r}`].filter(Boolean).join('\n\n'), author: '' }
  );
  return out;
}
