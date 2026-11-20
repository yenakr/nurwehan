import type { ChartData, Row } from './types';
import { formScore } from './[id]/EhrForms';

const num = (v: string | undefined) => {
  const n = parseFloat((v || '').replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// 위험 수치 (마지막 활력징후 / 검사별 마지막 결과)
export function criticalFlags(d: ChartData): string[] {
  const out: string[] = [];
  const v: Row | undefined = [...d.vitals].reverse().find(r => r.bp || r.hr || r.rr || r.bt || r.spo2);
  if (v) {
    const sbp = num((v.bp || '').split('/')[0]);
    const hr = num(v.hr), rr = num(v.rr), bt = num(v.bt), sp = num(v.spo2);
    if (sbp !== null && (sbp < 90 || sbp > 180)) out.push(`수축기혈압 ${sbp}`);
    if (hr !== null && (hr < 50 || hr > 120)) out.push(`맥박 ${hr}`);
    if (rr !== null && (rr < 10 || rr > 28)) out.push(`호흡 ${rr}`);
    if (bt !== null && (bt >= 38.5 || bt < 35)) out.push(`체온 ${bt}`);
    if (sp !== null && sp < 90) out.push(`SpO₂ ${sp}`);
  }
  const last = new Map<string, Row>();
  d.labs.forEach(r => { if (r.name && r.value) last.set(r.name.trim().toLowerCase(), r); });
  last.forEach(r => {
    const n = (r.name || '').toLowerCase();
    const x = num(r.value);
    if (x === null) return;
    const hit = (cond: boolean) => cond && out.push(`${r.name} ${r.value}`);
    if (/^(k|potassium|칼륨)\b/.test(n)) hit(x < 3.0 || x > 6.0);
    else if (/^(na|sodium|나트륨)\b/.test(n)) hit(x < 125 || x > 155);
    else if (/glucose|glu|혈당/.test(n)) hit(x < 50 || x > 400);
    else if (/^(hb|hgb|hemoglobin|혈색소)/.test(n)) hit(x < 7);
    else if (/^(plt|platelet|혈소판)/.test(n)) hit((x > 1000 ? x / 1000 : x) < 50);
  });
  return out;
}

export const BMI = (h?: string, w?: string) => {
  const hh = num(h), ww = num(w);
  if (!hh || !ww || hh < 50) return '';
  const b = ww / Math.pow(hh / 100, 2);
  return b.toFixed(1);
};

// 병동 목록 배지
export function badgesOf(d: ChartData): string {
  const b: string[] = [];
  const f = d.forms || {};
  const morse = (f.morse || [])[0];
  const braden = (f.braden || [])[0];
  const m = morse ? formScore('morse', morse) : null;
  const br = braden ? formScore('braden', braden) : null;
  if (m !== null && m >= 45) b.push('낙상');
  if (br !== null && br <= 18) b.push('욕창');
  if (d.info.iso && d.info.iso !== '없음') b.push('격리');
  if (d.info.npo === '1') b.push('금식');
  if (d.info.allergy && !/^(없음|무|none|-)$/i.test(d.info.allergy.trim())) b.push('알레르기');
  return b.join(',');
}

export const DC_EDU = ['복약 방법·부작용', '식이', '활동·운동', '상처·튜브 관리', '응급 증상과 내원 시점', '외래 예약'];
export const ISO = ['없음', '접촉', '비말', '공기', '보호'];
