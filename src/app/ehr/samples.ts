import type { Row, Sample } from './types';

// 가상 환자 예시 (실제 환자 정보 아님)
const sec = (name: string): Row => ({ kind: 'sec', name });
const memo = (name: string): Row => ({ kind: 'memo', name });
const od = (name: string, dose: string, unit: string, cnt: string, route: string, st: string, times: string[] = [], ck = ''): Row => {
  const r: Row = { name, dose, unit, cnt, route, st, ck };
  times.forEach((t, i) => (r[`t${i + 1}`] = t));
  return r;
};
const basic = (extra: Row[] = []): Row[] => [
  sec('▶ 기본처방 ◀'),
  od('Check V/S q [8] hrs', '', '', '', '', '', [], '1'),
  od('Check I/O q [24] hrs', '', '', '', '', '', [], '1'),
  ...extra,
];

export const SAMPLES: Sample[] = [
  {
    key: 'adult',
    subject: '성인간호',
    title: '성인 · 심부전 악화',
    data: {
      info: {
        sampleKey: 'adult', bed: '5203-1', ptNo: '00000001', name: '김OO', ageSex: '72/F', ward: '52병동', dept: 'CV', doctor: '홍OO', admit: '2026-11-10', allergy: '페니실린 (발진)',
        dx: 'Acute decompensated heart failure',
        cc: '호흡곤란, 하지 부종', onset: '2026-11-07',
        hpi: '3일 전부터 계단 오를 때 숨이 차고 밤에 기침 및 누우면 숨이 찬 증상 있어 외래 경유하여 입원함.\n체중 3일간 2.5kg 증가.',
        pmh: '고혈압(유) 15년, 당뇨(무), 결핵(무), 간염(무), 관상동맥질환(유)', fh: '부) 뇌졸중', social: '무', drink: '무', smoke: '무',
        pe: '혈압 152/94 (mmHg)  맥박 104 (/min)  호흡 24 (/min)  체온 36.8 (C)\nGeneral: Chronic ill-looking  Mental status: Alert\nChest: bibasilar crackles(+)  Edema: pitting 2+ both legs',
        plan: '- 이뇨제 치료, O2 적용\n- 심초음파, BNP, 전해질 f/u\n- 저염식, 수분 제한',
        route: '외래', method: '휠체어', informant: '환자', job: '무직', religion: '무교', marital: '기혼', lang: '한국어', purpose: 'treatment', insight: '유',
        bedsore: '22', fall: '35', pain: '무',
      },
      progress: [
        { time: '2026-11-10 10:20', dept: 'CV', text: 'S) 숨찬 것 조금 나아짐\nO) BP 140/88, HR 96, SpO2 93% (2L NC), Lung crackles(+)\nA) ADHF\nP) IV furosemide 유지, I/O 모니터, K f/u', author: '홍OO' },
      ],
      orders: [
        ...basic([
          od('Check BW', '', '', '', '', '', [], '1'),
          memo('※ 매일 아침, 소변 본 직후에 측정.'),
          od('저염식 (2g Na) / 수분 1,000mL 제한', '', '', '', '', ''),
          od('O2 2L/min NC (SpO2 94% 이상 유지)', '', '', '', '', ''),
        ]),
        sec('▶ 주사약 ◀'),
        od('Furosemide 20mg/2mL (라식스)', '40', 'mg', '2회', 'IV', '집계완료', ['09:00/종', '17:00/']),
        od('0.9% Sod. Chloride 50ml/B', '50', 'ml', '2회', 'IV', '집계완료', ['09:00/종', '17:00/']),
        sec('▶ 먹는약 ◀'),
        od('Carvedilol 6.25mg (딜라트렌)', '1', 'T', '2회', 'PO', '집계완료', ['09:00/종', '21:00/']),
        memo('※ HR 60 미만 또는 SBP 90 미만 시 보류 후 보고'),
        od('Spironolactone 25mg (알닥톤)', '1', 'T', '1회', 'PO', '집계완료', ['09:00/종']),
        sec('▶ 약주시 PRN ◀'),
        od('Acetaminophen 650mg (타이레놀)', '1', 'T', '0회/4회', 'PO', ''),
        memo('※ 최대투여횟수 4회, 최소투여간격 6시간'),
        sec('▶ 검 사 ◀'),
        od('Echocardiography', '', '', '', '', '접수'),
        od('K, BNP, Cr (f/u)', '', '', '', '', '접수'),
      ],
      vitals: [
        { time: '08:00', bp: '152/94', hr: '104', rr: '24', bt: '36.8', spo2: '90', pain: '0' },
        { time: '12:00', bp: '140/88', hr: '96', rr: '22', bt: '36.7', spo2: '93', pain: '0' },
      ],
      io: [
        { time: '08-12', intake: 'PO 300 / IV 100', output: '소변 450', note: '' },
        { time: '12-16', intake: 'PO 250', output: '소변 700', note: 'Furosemide 후 이뇨' },
      ],
      labs: [
        { name: 'BNP', value: '980', unit: 'pg/mL', min: '0', max: '100', sample: 'Blood', time: '11-10 05:30' },
        { name: 'K (Potassium)', value: '3.4', unit: 'mmol/L', min: '3.5', max: '5.0', sample: 'Blood', time: '11-10 05:30' },
        { name: 'Creatinine', value: '1.2', unit: 'mg/dL', min: '0.5', max: '1.1', sample: 'Blood', time: '11-10 05:30' },
        { name: 'Na (Sodium)', value: '138', unit: 'mmol/L', min: '135', max: '145', sample: 'Blood', time: '11-10 05:30' },
      ],
      notes: [
        { time: '11-10 10:00', focus: '호흡곤란', text: 'D)\n움직일 때 숨이 차다고 호소, RR 24, SpO2 90% (room air)\n\nA)\n반 파울러 자세 취해주고 O2 2L NC 적용함. 활동 최소화 교육함.\n\nR)\n30분 후 RR 22, SpO2 93%, 호흡곤란 완화됨.', author: '간호사A' },
      ],
      care: [
        { dx: '심박출량 감소', goal: '48시간 내 SpO2 94% 이상, 하지 부종 감소', plan: '활력징후·I&O 모니터, 체중 측정, 이뇨제 투여 및 반응 확인, 염분·수분 제한 교육', eval: '' },
      ],
    },
  },
  {
    key: 'child',
    subject: '아동간호',
    title: '아동 · RSV 세기관지염',
    data: {
      info: {
        sampleKey: 'child', bed: '6103-1', ptNo: '00000002', name: '이OO', ageSex: '8M/M', ward: '소아병동', dept: 'PD', doctor: '박OO', admit: '2026-11-11', allergy: '무',
        dx: 'RSV bronchiolitis', cc: '기침, 쌕쌕거림, 수유 거부', onset: '2026-11-09',
        hpi: '2일 전부터 콧물, 기침 시작. 어제부터 쌕쌕거리고 수유량 절반으로 감소하여 내원함.', pmh: '만삭 출생, 특이사항 없음', fh: '형 감기 증상', social: '무', drink: '-', smoke: '-',
        pe: '체온 38.2 (C)  맥박 168  호흡 58  SpO2 91%\nGeneral: Irritable  Chest: wheezing(+), retraction(+)', plan: '- O2, 흡인, 수액 유지\n- 접촉·비말 격리',
        route: '외래', method: '안김', informant: '모', job: '-', religion: '-', marital: '-', lang: '한국어', purpose: 'treatment', insight: '-', bedsore: '-', fall: '-', pain: '무',
      },
      progress: [],
      orders: [
        ...basic([od('O2 투여 (SpO2 95% 이상 유지)', '', '', '', '', ''), od('Suction PRN', '', '', '', '', ''), od('격리 (접촉·비말)', '', '', '', '', '')]),
        sec('▶ 주사약 ◀'),
        od('5% Dextrose / 0.45% NaCl 500ml', '40', 'ml/hr', '지속', 'IV', '집계완료'),
        sec('▶ 약주시 PRN ◀'),
        od('Acetaminophen syrup', '체중 기준', 'ml', '0회/4회', 'PO', ''),
        memo('※ BT 38.5 이상 시, 최소투여간격 6시간'),
      ],
      vitals: [
        { time: '08:00', bp: '-', hr: '168', rr: '58', bt: '38.2', spo2: '91', pain: '-' },
        { time: '12:00', bp: '-', hr: '150', rr: '48', bt: '37.6', spo2: '95', pain: '-' },
      ],
      io: [{ time: '08-12', intake: '분유 90', output: '기저귀 소변 2회', note: '수유량 감소' }],
      labs: [{ name: 'RSV Ag', value: '양성', unit: '', min: '', max: '', sample: 'NPA', time: '11-11 09:10' }],
      notes: [{ time: '11-11 09:00', focus: '비효율적 기도청결', text: 'D)\n\nA)\n\nR)\n', author: '' }],
      care: [{ dx: '비효율적 기도청결', goal: '', plan: '', eval: '' }],
    },
  },
  {
    key: 'women',
    subject: '모성간호',
    title: '모성 · 제왕절개 산후 1일',
    data: {
      info: {
        sampleKey: 'women', bed: '4302-1', ptNo: '00000003', name: '박OO', ageSex: '33/F', ward: '산부인과병동', dept: 'OB', doctor: '최OO', admit: '2026-11-10', allergy: '무',
        dx: 'Cesarean section POD#1 (G1P1)', cc: '수술 부위 통증', onset: '2026-11-11',
        hpi: '38주 3일, 아두골반불균형으로 2026-11-11 제왕절개 분만함.', pmh: '특이사항 무', fh: '무', social: '무', drink: '무', smoke: '무',
        pe: '혈압 112/70  맥박 82  호흡 18  체온 37.4\nFundus: 제하 1횡지, firm  Lochia: rubra, 소량', plan: '- 조기 이상\n- 자궁저부 마사지, 오로 관찰\n- 모유수유 교육',
        route: '외래', method: '침대', informant: '환자', job: '회사원', religion: '무교', marital: '기혼', lang: '한국어', purpose: 'delivery', insight: '유', bedsore: '-', fall: '25', pain: 'NRS 5',
      },
      progress: [],
      orders: [
        ...basic([od('Fundal massage & Lochia check q shift', '', '', '', '', ''), od('조기 이상', '', '', '', '', '')]),
        sec('▶ 주사약 ◀'),
        od('Ketorolac 30mg/1mL', '30', 'mg', '3회', 'IV', '집계완료', ['09:00/', '17:00/', '01:00/']),
        od('Oxytocin 10IU + N/S 500ml', '', '', '지속', 'IV', '집계완료'),
      ],
      vitals: [{ time: '08:00', bp: '112/70', hr: '82', rr: '18', bt: '37.4', spo2: '98', pain: '5' }],
      io: [{ time: '08-12', intake: 'PO 500', output: '소변 300', note: '소변줄 제거 후 첫 배뇨' }],
      labs: [{ name: 'Hb (Hemoglobin)', value: '10.2', unit: 'g/dL', min: '12.0', max: '16.0', sample: 'Blood', time: '11-12 05:30' }],
      notes: [{ time: '11-12 10:00', focus: '수술 부위 통증', text: 'D)\n\nA)\n\nR)\n', author: '' }],
      care: [{ dx: '급성 통증', goal: '', plan: '', eval: '' }],
    },
  },
  {
    key: 'psych',
    subject: '정신간호',
    title: '정신 · 조현병 급성기',
    data: {
      info: {
        sampleKey: 'psych', bed: '7102-1', ptNo: '00000004', name: '최OO', ageSex: '27/M', ward: '정신건강의학과병동', dept: 'PSY', doctor: '윤OO', admit: '2026-11-09', allergy: '무',
        dx: 'Schizophrenia, acute exacerbation', cc: '환청, 피해망상', onset: '2026-10-25',
        hpi: '2주 전 약물 임의 중단 후 "나를 감시한다", "목소리가 들린다"며 불면 및 불안정, 가족과 내원함.', pmh: '조현병(유) 5년', fh: '무', social: '무', drink: '가끔', smoke: '유 (10개비/일)',
        pe: '혈압 124/80  맥박 88\nMental status: Alert, auditory hallucination(+), persecutory delusion(+)', plan: '- 약물 순응도 확인(입안 확인)\n- 자극 최소화\n- 낮병동 프로그램',
        route: '응급실', method: '보호자 동반', informant: '모', job: '무직', religion: '무교', marital: '미혼', lang: '한국어', purpose: 'treatment', insight: '무', bedsore: '-', fall: '15', pain: '무',
      },
      progress: [],
      orders: [
        ...basic([od('Observation q 30min', '', '', '', '', '')]),
        sec('▶ 먹는약 ◀'),
        od('Olanzapine 10mg (자이프렉사)', '1', 'T', '1회', 'PO', '집계완료', ['21:00/']),
        memo('※ 삼킴 확인 (입안 확인)'),
      ],
      vitals: [{ time: '08:00', bp: '124/80', hr: '88', rr: '18', bt: '36.6', spo2: '98', pain: '0' }],
      io: [],
      labs: [],
      notes: [{ time: '11-12 10:00', focus: '환청', text: 'D)\n\nA)\n\nR)\n', author: '' }],
      care: [{ dx: '감각지각 장애(환청)', goal: '', plan: '', eval: '' }],
    },
  },
  {
    key: 'community',
    subject: '지역사회간호',
    title: '지역사회 · 독거노인 방문',
    data: {
      info: {
        sampleKey: 'community', bed: '방문1', ptNo: '방문1회', name: '정OO', ageSex: '78/F', ward: '지역사회', dept: '', doctor: '', admit: '2026-11-12', allergy: '무',
        dx: 'HTN, DM 관리', cc: '약 복용 불규칙', onset: '',
        hpi: '독거. 혈압약·당뇨약을 자주 거른다고 함. 최근 어지러움 호소.', pmh: '고혈압 12년, 당뇨 10년', fh: '무', social: '독거, 기초수급', drink: '무', smoke: '무',
        pe: '혈압 158/92  맥박 78  식전 혈당 168', plan: '- 복약 교육, 약 달력 제공\n- 낙상 위험 평가\n- 주민센터·보건소 자원 연계',
        route: '방문', method: '-', informant: '환자', job: '무직', religion: '불교', marital: '사별', lang: '한국어', purpose: 'care', insight: '유', bedsore: '-', fall: '45', pain: 'NRS 2',
      },
      progress: [],
      orders: [
        sec('▶ 방문 계획 ◀'),
        od('혈압·혈당 측정', '', '', '', '', ''),
        od('복약 이행 확인 및 교육', '', '', '', '', ''),
        od('낙상 위험 평가', '', '', '', '', ''),
      ],
      vitals: [{ time: '14:00', bp: '158/92', hr: '78', rr: '18', bt: '36.5', spo2: '97', pain: '2' }],
      io: [],
      labs: [{ name: '식전 혈당 (Glucose)', value: '168', unit: 'mg/dL', min: '70', max: '100', sample: 'POCT', time: '11-12 14:10' }],
      notes: [{ time: '11-12 14:30', focus: '복약 이행', text: 'D)\n\nA)\n\nR)\n', author: '' }],
      care: [{ dx: '비효율적 건강관리', goal: '', plan: '', eval: '' }],
    },
  },
];

export type Ward = { name: string; code: string; beds: number };
export const WARDS: Ward[] = [
  { name: '52병동', code: '52', beds: 8 },
  { name: '소아병동', code: '61', beds: 6 },
  { name: '산부인과병동', code: '43', beds: 6 },
  { name: '정신건강의학과병동', code: '71', beds: 6 },
  { name: '지역사회', code: '방문', beds: 4 },
];
export const bedLabel = (w: Ward, i: number) => (w.code === '방문' ? `방문${i}` : `${w.code}${String(i).padStart(2, '0')}-1`);
