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
};

export const emptyChart = (): ChartData => ({
  info: {},
  progress: [],
  orders: [],
  vitals: [],
  io: [],
  labs: [],
  notes: [],
  care: [],
});

export type Sample = { key: string; subject: string; title: string; data: ChartData };

// 예전 형식(1차 버전)으로 저장된 차트도 열리도록 변환
export function migrate(raw: unknown): ChartData {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = emptyChart();
  const arr = (k: string): Row[] => (Array.isArray(r[k]) ? (r[k] as Row[]) : []);
  const info: Record<string, string> = { ...((r.info as Record<string, string>) || {}) };
  if (info.history && !info.pmh) info.pmh = info.history;
  if (info.orders && !info.plan) info.plan = info.orders;

  let orders = arr('orders');
  const meds = arr('meds');
  if (orders.length === 0 && meds.length > 0) {
    orders = [
      { kind: 'sec', name: '▶ 투약 ◀' },
      ...meds.map(m => ({ name: m.drug || '', dose: m.dose || '', route: m.route || '', ck: m.done ? '1' : '', t1: m.time || '', st: '', memo: m.note || '' })),
    ];
  }
  const notes = arr('notes').map(n =>
    n.text !== undefined || (!n.d && !n.a && !n.r)
      ? n
      : { time: n.time || '', focus: n.focus || '', text: [n.d && `D)\n${n.d}`, n.a && `A)\n${n.a}`, n.r && `R)\n${n.r}`].filter(Boolean).join('\n\n'), author: '' }
  );
  return { ...base, info, orders, notes, progress: arr('progress'), vitals: arr('vitals'), io: arr('io'), labs: arr('labs'), care: arr('care') };
}
