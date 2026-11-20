export type Row = Record<string, string>;

export type ChartData = {
  info: Record<string, string>;
  progress: Row[]; // 경과기록
  orders: Row[]; // 의사처방 (kind: '' | 'sec' | 'memo')
  vitals: Row[]; // 임상관찰
  io: Row[];
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
  forms: Record<string, Row[]>; // 평가도구(낙상·욕창·통증·수술 전 확인)
};

const LISTS = ['progress', 'orders', 'vitals', 'io', 'labs', 'notes', 'care', 'transfusion', 'nutrition', 'consult', 'consent', 'surgery', 'appts', 'handover', 'risk', 'history', 'imaging', 'memos'] as const;

export const emptyChart = (): ChartData => {
  const d: Record<string, unknown> = { info: {}, forms: {} };
  LISTS.forEach(k => (d[k] = []));
  return d as ChartData;
};

export type Sample = { key: string; subject: string; title: string; data: Partial<ChartData> & { info: Record<string, string> } };

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
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => k !== 'appts' && scan(x));
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
export function migrate(raw: unknown): ChartData {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = emptyChart() as unknown as Record<string, unknown>;
  LISTS.forEach(k => {
    if (Array.isArray(r[k])) base[k] = r[k];
  });
  const info: Record<string, string> = { ...((r.info as Record<string, string>) || {}) };
  if (info.history && !info.pmh) info.pmh = info.history;
  if (info.orders && !info.plan) info.plan = info.orders;
  const out = base as unknown as ChartData;
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
