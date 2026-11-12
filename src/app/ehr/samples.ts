import type { Sample } from './types';

// 가상 환자 예시 (실제 환자 정보 아님)
export const SAMPLES: Sample[] = [
  {
    key: 'adult',
    subject: '성인간호',
    title: '성인 · 심부전 악화',
    data: {
      info: {
        name: '김OO', ageSex: '72 / 여', dx: '울혈성 심부전 급성 악화', admit: '11/10', cc: '호흡곤란, 하지 부종 3일',
        history: 'HTN 15년, 관상동맥질환', allergy: '페니실린 (발진)',
        orders: '반 파울러 자세 / 저염식 · 수분 1,000mL 제한 / I&O 체크 / 매일 체중 측정 / O2 2L NC (SpO2 94% 이상 유지)',
      },
      vitals: [
        { time: '08:00', bp: '152/94', hr: '104', rr: '24', bt: '36.8', spo2: '90', pain: '0' },
        { time: '12:00', bp: '140/88', hr: '96', rr: '22', bt: '36.7', spo2: '93', pain: '0' },
      ],
      io: [
        { time: '08-12', intake: 'PO 300 / IV 100', output: '소변 450', note: '' },
        { time: '12-16', intake: 'PO 250', output: '소변 700', note: 'Furosemide 후 이뇨' },
      ],
      meds: [
        { time: '09:00', drug: 'Furosemide', dose: '40mg', route: 'IV', done: '확인', note: '투여 후 소변량 관찰' },
        { time: '09:00', drug: 'Carvedilol', dose: '6.25mg', route: 'PO', done: '', note: 'HR 60 미만 시 보류' },
      ],
      labs: [
        { name: 'BNP', value: '980', ref: '<100 pg/mL', flag: 'H' },
        { name: 'K', value: '3.4', ref: '3.5-5.0', flag: 'L' },
        { name: 'Cr', value: '1.2', ref: '0.5-1.1', flag: 'H' },
      ],
      notes: [
        { time: '10:00', focus: '호흡곤란', d: '움직일 때 숨이 차다고 호소, RR 24, SpO2 90% (room air)', a: '반 파울러 자세, O2 2L NC 적용, 활동 최소화 교육', r: '30분 후 RR 22, SpO2 93%, 호흡곤란 완화됨' },
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
        name: '이OO', ageSex: '8개월 / 남', dx: 'RSV 세기관지염', admit: '11/11', cc: '기침, 쌕쌕거림, 수유 거부 2일',
        history: '만삭 출생, 특이사항 없음', allergy: '없음',
        orders: 'O2 투여 (SpO2 95% 이상) / 흡인(suction) 필요 시 / 수유 소량 자주 / I&O 체크 / 격리(접촉·비말)',
      },
      vitals: [
        { time: '08:00', bp: '-', hr: '168', rr: '58', bt: '38.2', spo2: '91', pain: '-' },
        { time: '12:00', bp: '-', hr: '150', rr: '48', bt: '37.6', spo2: '95', pain: '-' },
      ],
      io: [{ time: '08-12', intake: '분유 90', output: '기저귀 소변 2회', note: '수유량 감소' }],
      meds: [{ time: '08:30', drug: 'Acetaminophen', dose: '체중 기준 용량', route: 'PO', done: '', note: '체온 38.5 이상 시' }],
      labs: [{ name: 'RSV Ag', value: '양성', ref: '음성', flag: 'H' }],
      notes: [{ time: '09:00', focus: '비효율적 기도청결', d: '', a: '', r: '' }],
      care: [{ dx: '비효율적 기도청결', goal: '', plan: '', eval: '' }],
    },
  },
  {
    key: 'women',
    subject: '모성간호',
    title: '모성 · 제왕절개 산후 1일',
    data: {
      info: {
        name: '박OO', ageSex: '33 / 여', dx: '제왕절개 후 1일 (G1P1)', admit: '11/10', cc: '수술 부위 통증',
        history: '특이사항 없음', allergy: '없음',
        orders: 'PCA 유지 / 조기 이상 / 자궁저부 마사지 및 오로 관찰 / 유방 관리 / 소변줄 제거 후 배뇨 확인',
      },
      vitals: [{ time: '08:00', bp: '112/70', hr: '82', rr: '18', bt: '37.4', spo2: '98', pain: '5' }],
      io: [{ time: '08-12', intake: 'PO 500', output: '소변 300', note: '소변줄 제거 후 첫 배뇨' }],
      meds: [{ time: '09:00', drug: 'Ketorolac', dose: '30mg', route: 'IV', done: '', note: '통증 NRS 4 이상' }],
      labs: [{ name: 'Hb', value: '10.2', ref: '12-16', flag: 'L' }],
      notes: [{ time: '10:00', focus: '수술 부위 통증', d: '', a: '', r: '' }],
      care: [{ dx: '급성 통증', goal: '', plan: '', eval: '' }],
    },
  },
  {
    key: 'psych',
    subject: '정신간호',
    title: '정신 · 조현병 급성기',
    data: {
      info: {
        name: '최OO', ageSex: '27 / 남', dx: '조현병 (급성기)', admit: '11/09', cc: '환청, 피해망상',
        history: '약물 중단 후 악화', allergy: '없음',
        orders: '매 30분 관찰 / 약물 복용 확인(입안 확인) / 자극 최소화 환경 / 낮병동 프로그램 참여 권유',
      },
      vitals: [{ time: '08:00', bp: '124/80', hr: '88', rr: '18', bt: '36.6', spo2: '98', pain: '0' }],
      io: [],
      meds: [{ time: '09:00', drug: 'Olanzapine', dose: '10mg', route: 'PO', done: '', note: '삼킴 확인' }],
      labs: [],
      notes: [{ time: '10:00', focus: '환청', d: '', a: '', r: '' }],
      care: [{ dx: '감각지각 장애(환청)', goal: '', plan: '', eval: '' }],
    },
  },
  {
    key: 'community',
    subject: '지역사회간호',
    title: '지역사회 · 독거노인 방문',
    data: {
      info: {
        name: '정OO', ageSex: '78 / 여', dx: '고혈압, 당뇨 관리 필요', admit: '방문 1회차', cc: '약 복용 불규칙',
        history: 'HTN, DM 10년', allergy: '없음',
        orders: '혈압·혈당 측정 / 복약 상태 확인 / 낙상 위험 평가 / 지역사회 자원 연계',
      },
      vitals: [{ time: '14:00', bp: '158/92', hr: '78', rr: '18', bt: '36.5', spo2: '97', pain: '2' }],
      io: [],
      meds: [{ time: '-', drug: 'Amlodipine', dose: '5mg', route: 'PO', done: '', note: '불규칙 복용' }],
      labs: [{ name: '식전 혈당', value: '168', ref: '70-100', flag: 'H' }],
      notes: [{ time: '14:30', focus: '복약 이행', d: '', a: '', r: '' }],
      care: [{ dx: '비효율적 건강관리', goal: '', plan: '', eval: '' }],
    },
  },
];
