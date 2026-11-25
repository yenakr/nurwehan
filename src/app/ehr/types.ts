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
  forms: Record<string, Row[]>; // 평가도구(낙상·욕창·통증·수술 전 확인)
};

const LISTS = ['progress', 'orders', 'vitals', 'io', 'bst', 'diet', 'dxcode', 'nact', 'mat', 'dietord', 'ret', 'dcmed', 'dcnote', 'sched', 'acu', 'docs', 'labs', 'notes', 'care', 'transfusion', 'nutrition', 'consult', 'consent', 'surgery', 'appts', 'handover', 'risk', 'history', 'imaging', 'memos', 'mar', 'lines', 'iv', 'wounds', 'edu', 'specimen', 'transport', 'moves', 'cpr', 'anes'] as const;

export const emptyChart = (): ChartData => {
  const d: Record<string, unknown> = { info: {}, forms: {} };
  LISTS.forEach(k => (d[k] = []));
  return d as ChartData;
};

export type Sample = { key: string; subject: string; title: string; data: Partial<ChartData> & { info: Record<string, string> } };

// 미래 일정을 담는 항목은 기준일 계산에서 뺀다
const FUTURE = new Set(['appts', 'chg', 'disDate']);

// 샘플 차트의 날짜를 오늘 기준으로 옮긴다 (가장 늦은 날짜가 오늘이 되도록)
export function shiftChart(src: ChartData): ChartData {
  const pad = (n: number) => String(n).padStart(2, '0');
  const FULL = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  const MD = /^(\d{2})-(\d{2})( \d{2}:\d{2})/;
  let max = 0;
  const scan = (v: unknown) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(FULL)) max = Math.max(max, Date.UTC(+m[1], +m[2] - 1, +m[3]));
      const mm = v.match(MD);
      if (mm) max = Math.max(max, Date.UTC(2026, +mm[1] - 1, +mm[2]));
    } else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => !FUTURE.has(k) && scan(x));
  };
  scan(src);
  if (!max) return src;
  const now = new Date();
  const delta = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - max;
  if (delta === 0) return src;
  const shift = (v: unknown): unknown => {
    if (typeof v === 'string') {
      let out = v.replace(FULL, (_, y, mo, d) => {
        const t = new Date(Date.UTC(+y, +mo - 1, +d) + delta);
        return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
      });
      out = out.replace(MD, (_, mo, d, rest) => {
        const t = new Date(Date.UTC(2026, +mo - 1, +d) + delta);
        return `${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}${rest}`;
      });
      return out;
    }
    if (Array.isArray(v)) return v.map(shift);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shift(x)]));
    return v;
  };
  return shift(src) as ChartData;
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
