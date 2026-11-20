import type { Row } from '../types';

// 가상 환자 예시 (실제 환자 정보 아님). 날짜는 기준일(2026-11-20) 대비 상대값으로 쓰고, 화면에서는 오늘 기준으로 이동한다.
const pad = (n: number) => String(n).padStart(2, '0');
const base = (off: number) => new Date(Date.UTC(2026, 10, 20 + off));
export const dt = (off: number) => { const t = base(off); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
export const md = (off: number, hm: string) => { const t = base(off); return `${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${hm}`; };
export const full = (off: number, hm: string) => `${dt(off)} ${hm}`;

export const sec = (name: string): Row => ({ kind: 'sec', name });
export const memo = (name: string): Row => ({ kind: 'memo', name });
export const od = (name: string, dose = '', unit = '', cnt = '', route = '', st = '', times: string[] = [], ck = '', pri = ''): Row => {
  const r: Row = { name, dose, unit, cnt, route, st, ck };
  if (pri) r.pri = pri;
  times.forEach((t, i) => (r[`t${i + 1}`] = t));
  return r;
};
export const vit = (time: string, bp: string, hr: string, rr: string, bt: string, spo2: string, pain = '0'): Row => ({ time, bp, hr, rr, bt, spo2, pain });

const qs = (a: number[]): Row => Object.fromEntries(a.map((n, i) => [`q${i}`, String(n)]));
// 낙상(Morse) 6문항: [과거력, 이차진단, 보행보조, 정맥주입, 걸음걸이, 정신상태] 선택지 번호
export const morse = (time: string, a: number[]): Row => ({ time, ...qs(a) });
// 욕창(Braden) 6문항: [감각, 습기, 활동, 기동성, 영양, 마찰] 선택지 번호
export const braden = (time: string, a: number[]): Row => ({ time, ...qs(a) });
export const painForm = (time: string, nrs: string, site: string, quality: string, pattern: string, worse: string, better: string, act: string, re: string): Row => ({ time, nrs, site, quality, pattern, worse, better, act, re });
// 수술 전 확인 13항목 중 '예'로 확인한 번호
export const preop = (time: string, yes: number[], note = ''): Row => ({ time, ...Object.fromEntries(yes.map(n => [`p${n}`, '예'])), ...(note ? { memo: note } : {}) });
export const ALL13 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const consent = (name: string, date: string, doctor: string, signer: string, sig: string, rel = ''): Row => ({
  name, date, st: '서명완료', doctor, signer, sig, ...(rel ? { rel } : {}), ck: '0,1,2,3,4', chk: '5/5 확인',
});

export const mar = (time: string, name: string, dose: string, route: string, slot: string, by: string, extra: Row = {}): Row => ({ time, name, dose, route, slot, by, wb: '확인', ...extra });
