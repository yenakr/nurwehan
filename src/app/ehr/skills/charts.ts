// 핵심술기 EHR용 가상 환자 차트. 자율 EHR과는 info.mode = 'skill' 로 나뉜다.
import { emptyChart, migrate, shiftChart, type ChartData } from '../types';
import { od, vit, sec, memo, full, dt } from '../cases/h';

const mk = (key: string, info: Record<string, string>, clock: string, fill: (d: ChartData) => void): ChartData => {
  const d = emptyChart();
  d.info = {
    mode: 'skill', skill: key, sampleKey: `sk:${key}`, dept: 'GS', doctor: '김담당', orderDate: dt(0), admit: dt(-3),
    height: '165', weight: '58', iso: '', npo: '0', surg: '0', lang: '한국어', ...info,
    vbase: full(0, clock), slotDay: dt(0), dataVer: 'sk1',
  };
  fill(d);
  return shiftChart(migrate(d));
};
const basic = () => [sec('▶ 기본처방 ◀'), od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'), od('Check I/O q [8] hrs', '', '', '', '', '', [], '1')];

export function buildSkillChart(key: string): { title: string; data: ChartData } | null {
  if (key === 'med') {
    return { title: '[술기] 투약 · 박서연', data: mk(key, { bed: '608-1', ptNo: '9101', name: '박서연', ageSex: '67/F', ward: '61병동', dept: 'PUL', allergy: '페니실린 (전신 발진)', dx: 'Community-acquired pneumonia', doctor: '최호흡', cc: '기침, 가래, 발열' }, '08:50', d => {
      d.orders = [
        ...basic(), sec('▶ 주사약 ◀'),
        od('Furosemide 20mg/A (라식스)', '20', 'mg', '1회', 'IV', '집계완료', ['09:00/'], '1'),
        od('Amoxicillin/Clavulanate 1.2g/V (아목시클란)', '1.2', 'g', '3회', 'IV', '집계완료', ['09:00/', '17:00/', '01:00/'], '1'),
        sec('▶ 먹는약 ◀'),
        od('Amlodipine 5mg (아모디핀)', '5', 'mg', '1회', 'PO', '집계완료', ['09:00/'], '1'),
        memo('※ SBP 100 미만 시 보류 후 의사에게 보고'),
        od('Acetaminophen 500mg (타이레놀)', '500', 'mg', '0회/4회', 'PO', '', [], '', 'PRN'),
        memo('※ 체온 38.0℃ 이상일 때'),
      ];
      d.vitals = [vit(full(0, '04:00'), '110/68', '84', '18', '36.9', '96'), vit(full(0, '08:50'), '96/58', '88', '18', '36.8', '96')];
    }) };
  }
  if (key === 'braden') {
    return { title: '[술기] 욕창사정 · 이정식', data: mk(key, { bed: '905-2', ptNo: '9102', name: '이정식', ageSex: '81/M', ward: '91병동', dept: 'NS', allergy: '무', dx: 'Cerebral infarction', doctor: '정신경', cc: '좌측 편마비', weight: '60' }, '10:00', d => {
      d.orders = [...basic(), od('Position change q [2] hrs', '', '', '', '', '', [], '1'), od('Regular diet (연하곤란 주의)', '', '', '', '', '집계완료')];
      d.vitals = [vit(full(0, '08:00'), '128/76', '74', '18', '36.6', '97')];
    }) };
  }
  if (key === 'vital') {
    return { title: '[술기] 활력징후 · 최민준', data: mk(key, { bed: '810-1', ptNo: '9103', name: '최민준', ageSex: '55/M', ward: '81병동', allergy: '무', dx: 'Generalized peritonitis, POD#1', doctor: '한외과', cc: '복통' }, '13:55', d => {
      d.orders = [...basic(), sec('▶ 먹는약 ◀'), od('Acetaminophen 650mg (타이레놀)', '650', 'mg', '0회/4회', 'PO', '', [], '', 'PRN'), memo('※ 체온 38.0℃ 이상일 때')];
      d.vitals = [vit(full(0, '10:00'), '118/72', '84', '18', '37.2', '97', '3')];
    }) };
  }
  return null;
}
