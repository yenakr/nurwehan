// 실제 차트 데이터를 보고 채점한다 (핵심술기 EHR). 화면의 실시간 체크리스트와 AI 피드백이 같은 함수를 쓴다.
import type { ChartData, Row } from '../types';
import { SCENARIOS, type Rule } from './data';

export type Item = { id: string; group: string; label: string; tip: string; ok: boolean; avoid?: boolean };

const given = (o: Row | undefined) => !!o && Object.keys(o).some(k => /^t\d+$/.test(k) && /\/\S+/.test(o[k] || ''));
const ord = (d: ChartData, re: RegExp) => d.orders.find(o => re.test(o.name || ''));
const userNotes = (d: ChartData) => d.notes.filter(n => !/\(PDA/.test(n.text || '')).map(n => `${n.time || ''} ${n.focus || ''} ${n.text || ''}`).join('\n');
const fromRules = (rules: Rule[], text: string): Item[] => rules.map(r => ({ id: `n_${r.id}`, group: '간호기록', label: r.label, tip: r.tip, ok: r.test.every(t => t.test(text)) }));

const BRADEN_ANS = [2, 1, 0, 1, 1, 0];
const BRADEN_LABEL = ['감각 인지', '습기', '활동', '기동성', '영양', '마찰·전단력'];

export function gradeChart(key: string, d: ChartData): Item[] {
  const sc = SCENARIOS.find(s => s.key === key);
  const ns = sc?.steps.find(s => s.t === 'note');
  const text = userNotes(d);
  const notes = ns && ns.t === 'note' ? fromRules(ns.rules, text) : [];
  if (key === 'med') {
    const fu = ord(d, /furosemide/i), am = ord(d, /amlodipine/i), ax = ord(d, /amoxicillin/i), ac = ord(d, /acetaminophen/i);
    return [
      { id: 'p1', group: '수행', label: '푸로세미드 20mg IV 투약', tip: 'PDA로 환자 팔찌 → 약 순서로 스캔해 투약해요.', ok: given(fu) },
      { id: 'p2', group: '수행', label: 'PDA 스캔으로 수행', tip: '오더 화면에서 직접 체크하지 말고 PDA 스캔으로 수행해요.', ok: d.pda.some(e => e.type === 'give' && /furosemide/i.test(e.name || '')) },
      { id: 'p3', group: '수행', label: '암로디핀은 투약하지 않기 (SBP 96)', tip: 'SBP 100 미만이면 보류하고 보고해요.', ok: !given(am), avoid: true },
      { id: 'p4', group: '수행', label: '아목시클란은 투약하지 않기 (페니실린 알레르기)', tip: '알레르기 약은 투약 전에 의사에게 확인해요.', ok: !given(ax), avoid: true },
      { id: 'p5', group: '수행', label: '아세트아미노펜(PRN)은 주지 않기 (체온 36.8℃)', tip: 'PRN은 조건일 때만 줘요.', ok: !given(ac), avoid: true },
      { id: 'a1', group: '후 확인', label: 'PC에서 인증저장 (미인증 해소)', tip: '투약 미인증 기록 창에서 인증해요.', ok: given(fu) && !(fu?.ua || '') },
      ...notes,
    ];
  }
  if (key === 'braden') {
    const r = (d.forms?.braden || []).slice(-1)[0];
    const sc6: Item[] = BRADEN_LABEL.map((l, i) => ({ id: `b${i}`, group: '평가도구', label: `Braden ${l}`, tip: '관찰 내용에 맞는 항목을 고르세요.', ok: !!r && Number(r[`q${i}`]) === BRADEN_ANS[i] && r[`q${i}`] !== '' }));
    const wd = d.wounds.some(w => /천골|sacr/i.test(`${w.site} ${w.kind}`));
    return [...sc6, { id: 'w1', group: '상처·피부', label: '천골 발적 부위 기록 (상처·드레싱)', tip: '상처/드레싱 입력에 천골 부위를 남겨요.', ok: wd }, ...notes];
  }
  if (key === 'vital') {
    const row = d.vitals.find(v => /(^|\s)14(:\d\d)?\s*$/.test(v.time || '') || /14:\d\d/.test(`${v.at || ''} ${v.time || ''}`));
    const bp = row ? (row.bp || (row.sbp && row.dbp ? `${row.sbp}/${row.dbp}` : '')) : '';
    const chk = (label: string, v: string | undefined, want: string): Item => ({ id: `v_${label}`, group: '입력', label: `${label} ${want}`, tip: '측정기 화면 값을 그대로 입력해요.', ok: (v || '').trim() === want });
    return [
      chk('혈압', bp, '98/60'), chk('맥박', row?.hr, '112'), chk('호흡', row?.rr, '24'), chk('체온', row?.bt, '38.4'), chk('SpO₂', row?.spo2, '93'),
      { id: 'pn', group: '입력', label: '통증 NRS 6', tip: '통증 점수도 같이 입력해요.', ok: (row?.pain || '') === '6' },
      { id: 'ac', group: '수행', label: '해열제(PRN) 확인·투약 또는 기록', tip: 'PRN 해열제 조건(38.0℃↑)을 확인해요.', ok: given(ord(d, /acetaminophen/i)) || /해열|아세트아미노펜|타이레놀/.test(text) },
      ...notes,
    ];
  }
  return [];
}
