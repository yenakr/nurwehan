// 가상 시각: EHR 안의 모든 "지금"은 이 시계를 쓴다. (연습용 시나리오 날짜·시각)
let off = 0; // 가상 - 실제 (ms)
export const realNow = () => Date.now();
export const vnow = () => new Date(realNow() + off);
export const setVOffset = (ms: number) => { off = ms; };
const p2 = (n: number) => String(n).padStart(2, '0');
// 'YYYY-MM-DD HH:MM' <-> 가상 시각 (타임존 없이 화면 시각 그대로 다룬다)
export const parseV = (s?: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec((s || '').trim());
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : null;
};
export const fmtV = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
export const toInput = (d: Date) => fmtV(d).replace(' ', 'T');
