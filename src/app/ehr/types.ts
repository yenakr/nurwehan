export type Row = Record<string, string>;

export type ChartData = {
  info: Record<string, string>;
  vitals: Row[];
  io: Row[];
  meds: Row[];
  labs: Row[];
  notes: Row[];
  care: Row[];
};

export const emptyChart = (): ChartData => ({
  info: {},
  vitals: [],
  io: [],
  meds: [],
  labs: [],
  notes: [],
  care: [],
});

export type Sample = { key: string; subject: string; title: string; data: ChartData };
