import type { Row } from './types';

// 검사 처방 → 검체/참고치 (검체 채취 후 결과 자동 반영용)
type Ref = { name: string; unit: string; min: number; max: number; sample: string; dec: number };
const R = (name: string, unit: string, min: number, max: number, sample = 'Blood', dec = 1): Ref => ({ name, unit, min, max, sample, dec });
const PANELS: { re: RegExp; tests: Ref[] }[] = [
  { re: /CBC|일반혈액|complete blood/i, tests: [R('WBC', '10^3/uL', 4, 10), R('Hb', 'g/dL', 12, 16), R('Plt', '10^3/uL', 150, 400, 'Blood', 0)] },
  { re: /\bHb\b|혈색소/i, tests: [R('Hb', 'g/dL', 12, 16)] },
  { re: /CRP/i, tests: [R('CRP', 'mg/dL', 0, 0.5, 'Blood', 2)] },
  { re: /LFT|간기능|liver/i, tests: [R('AST', 'U/L', 5, 40, 'Blood', 0), R('ALT', 'U/L', 5, 40, 'Blood', 0), R('T.bilirubin', 'mg/dL', 0.2, 1.2, 'Blood', 1)] },
  { re: /BUN|Cr\b|신기능|creatinine|renal/i, tests: [R('BUN', 'mg/dL', 8, 23), R('Creatinine', 'mg/dL', 0.5, 1.2, 'Blood', 2)] },
  { re: /electrolyte|전해질|Na\/K|\bNa\b/i, tests: [R('Na', 'mmol/L', 135, 145, 'Blood', 0), R('K', 'mmol/L', 3.5, 5.1), R('Cl', 'mmol/L', 98, 107, 'Blood', 0)] },
  { re: /glucose|혈당|\bFBS\b|\bPP2\b/i, tests: [R('Glucose', 'mg/dL', 70, 110, 'Blood', 0)] },
  { re: /HbA1c/i, tests: [R('HbA1c', '%', 4, 6)] },
  { re: /PT|INR|응고|coag/i, tests: [R('PT(INR)', '', 0.8, 1.2, 'Blood', 2)] },
  { re: /albumin|알부민/i, tests: [R('Albumin', 'g/dL', 3.5, 5.2)] },
  { re: /troponin|트로포닌/i, tests: [R('Troponin-I', 'ng/mL', 0, 0.04, 'Blood', 3)] },
  { re: /U\/A|소변|urinalysis/i, tests: [R('Urine WBC', '/HPF', 0, 5, 'Urine', 0)] },
];
export const labTestsFor = (orderName: string): Ref[] => PANELS.find(p => p.re.test(orderName))?.tests || [];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
// 채혈(col) 후 due 시각이 지난 대기 검사에 결과를 채운다. 바뀐 게 없으면 같은 배열을 돌려준다.
export function resolveLabs(labs: Row[], now: number): Row[] {
  let ch = false;
  const out = labs.map(r => {
    if (r.value || !r.due || Number(r.due) > now) return r;
    const t = labTestsFor(r.name || '').find(x => x.name === r.name) || { min: parseFloat(r.min || '0'), max: parseFloat(r.max || '1'), dec: 1 };
    const h = hash(`${r.name}${r.col}`);
    const span = (t.max - t.min) || 1;
    const abn = h % 4 === 0; // 4건 중 1건은 이상치
    const v = abn ? (h % 2 ? t.max + span * 0.18 : t.min - span * 0.15) : t.min + span * (0.2 + ((h >> 3) % 60) / 100);
    const d = new Date(now); const p = (n: number) => String(n).padStart(2, '0');
    ch = true;
    return { ...r, value: Math.max(0, v).toFixed(t.dec), time: `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` };
  });
  return ch ? out : labs;
}
