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
};

const LISTS = ['progress', 'orders', 'vitals', 'io', 'labs', 'notes', 'care', 'transfusion', 'nutrition', 'consult', 'consent', 'surgery', 'appts', 'handover', 'risk', 'history', 'imaging'] as const;

export const emptyChart = (): ChartData => {
  const d: Record<string, unknown> = { info: {} };
  LISTS.forEach(k => (d[k] = []));
  return d as ChartData;
};

export type Sample = { key: string; subject: string; title: string; data: Partial<ChartData> & { info: Record<string, string> } };

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
