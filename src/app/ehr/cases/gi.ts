import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, morse, braden, painForm, consent, mar } from './h';

export const gi: Sample = {
  key: 'gi',
  subject: '내과',
  title: '소화기 · 상부 위장관 출혈',
  data: {
    info: {
      sampleKey: 'gi', bed: '701-1', ptNo: '0005', name: '오병훈', ageSex: '47/M', ward: '71병동', dept: 'GE', doctor: '오소화', admit: dt(-2), orderDate: dt(0),
      allergy: '무', dx: 'Upper GI bleeding, duodenal ulcer (Forrest Ib), H. pylori (+)', height: '172', weight: '68.0', iso: '없음', npo: '1', surg: '0',
      cc: '검은 변, 어지럼', onset: dt(-3),
      hpi: '3일 전부터 검은색 변을 하루 2~3회 보았고 어제부터 어지럽고 가슴이 두근거려 응급실 내원함. 최근 2주간 관절통으로 NSAIDs를 자주 복용함. 응급실에서 Hb 7.2, 응급 내시경에서 십이지장 궤양 출혈 확인 후 지혈술 시행하고 입원함.',
      pmh: '고혈압(무), 당뇨(무), 간염(무), 위염(유)', fh: '부) 위암', social: '회사원, 업무 스트레스', drink: '주 3회 소주 1병', smoke: '유 1갑/일',
      pe: '입원 시: 혈압 98/60 (mmHg)  맥박 118 (/min)  호흡 22 (/min)  체온 36.5 (℃)\nGeneral: Pale, anxious  Conjunctiva: pale  Abdomen: epigastric tenderness(+)',
      plan: '- 금식, 고용량 PPI 지속 주입, 수혈로 Hb 8 이상 유지\n- 24~48시간 후 재출혈 여부 관찰(혈변·구토, 활력징후)\n- H. pylori 제균 치료, NSAIDs 중단, 금주·금연 교육',
      route: '응급실', method: '휠체어', informant: '환자', job: '회사원', religion: '무교', marital: '기혼', lang: '한국어', purpose: 'treatment', insight: '유',
      bedsore: '20', fall: '20', pain: 'NRS 2 (상복부)',
      disDate: dt(4), disMethod: '보행', disPlace: '자택', disGuardian: '아내', disTarget: '환자, 아내', dcEdu: '',
    },
    progress: [
      { time: full(0, '09:00'), dept: 'GE', text: 'S) 어지럼 줄었고 검은 변은 어제 1회, 오늘은 없음. 복통 경미함.\nO) BP 112/70, HR 92, SpO2 98%. Hb 8.4 (어제 pRBC 2 unit 후) → 오늘 05:30 6.8로 저하. 복부 soft, mild epigastric tenderness.\nA) 십이지장 궤양 출혈, Forrest Ib, 지혈술 후 24시간\nP) 금식 유지, PPI 지속 주입, pRBC 1 unit 추가 수혈, 6시간 후 Hb 재검, 재출혈 시 응급 내시경.', author: '오소화' },
      { time: full(-1, '10:20'), dept: 'GE', text: 'S) 어제 응급 내시경 후 어지럼 호전. 검은 변 2회.\nO) BP 106/66, HR 100. Hb 8.4 (수혈 후). melena 지속.\nA) UGIB, 재출혈 감시\nP) 금식, PPI infusion, 활력징후 q2h, Hb q6h.', author: '오소화' },
      { time: full(-2, '17:30'), dept: 'GE', text: '응급 내시경: 십이지장 구부 후벽 궤양(1.5cm), Forrest Ib (oozing). Hemoclip 3개 + epinephrine 주입으로 지혈 완료. CLO test 양성.', author: '강위장' },
    ],
    orders: [
      sec('▶ 기본처방 ◀'),
      od('Check V/S q [2] hrs', '', '', '', '', '', [], '1'),
      od('Check I/O q [8] hrs', '', '', '', '', '', [], '1'),
      od('Stool character (color, amount) check & report', '', '', '', '', '', [], '1'),
      od('Check hematemesis if vomiting & report', '', '', '', '', '', [], '1'),
      memo('※ HR 110 이상 또는 SBP 90 미만 시 즉시 notify'),
      sec('▶ 식사 처방 ◀'),
      od('NPO', '', '', '', '', '집계완료', [], '1'),
      sec('▶ 주사약 ◀'),
      od('Pantoprazole 80mg bolus then 8mg/hr continuous infusion', '8', 'mg/hr', '지속', 'CIV', '집계완료', ['09:00/박'], '1'),
      memo('※ 고위험 약물: 펌프 설정 이중확인'),
      od('0.9% Sod. Chloride 1L (대한약품)', '1', 'L', '지속', 'IV', '집계완료', ['06:00/최'], '1'),
      od('Tranexamic acid 500mg', '500', 'mg', '3회', 'IV', '', [], '', 'D/C'),
      memo('※ 진행 중 지혈 확인으로 D/C'),
      od('Ondansetron 4mg/2mL (온단세트론)', '4', 'mg', '1회', 'IV', '', [], '', 'PRN'),
      memo('※ 구역 시. 최소투여간격 8시간.'),
      sec('▶ 수혈 ◀'),
      od('pRBC 1 unit', '1', 'unit', '1회', 'IV', '집계완료', ['10:40/박'], '', 'STAT'),
      sec('▶ 검 사 ◀'),
      od('Hb, Hct q 6 hrs', '', '', '', '', '집계완료', [], '1'),
      od('PT/aPTT', '', '', '', '', '집계완료', [], '1'),
      od('CLO test', '', '', '', '', '집계완료', [], '1'),
      od('Cross-matching pRBC 2 unit', '', '', '', '', '집계완료', [], '1'),
    ],
    mar: [
      mar(full(0, '09:10'), 'Pantoprazole 80mg bolus then 8mg/hr continuous infusion', '8mg/hr', 'CIV', '09:00', '박간호', { dbl: '이간호', note: '펌프 속도 8mg/hr 확인' }),
      mar(full(0, '10:40'), 'pRBC 1 unit', '1unit', 'IV', 'STAT', '박간호', { note: '2인 확인 후 시작' }),
    ],
    vitals: [
      vit(md(-2, '16:00'), '98/60', '118', '22', '36.5', '97', '3'),
      vit(md(-2, '20:00'), '102/62', '110', '20', '36.6', '98', '2'),
      vit(md(-1, '06:00'), '104/64', '104', '20', '36.6', '98', '2'),
      vit(md(-1, '14:00'), '106/66', '100', '20', '36.7', '98', '2'),
      vit(md(-1, '22:00'), '100/62', '108', '22', '36.6', '97', '2'),
      vit(md(0, '04:00'), '96/58', '112', '22', '36.6', '97', '3'),
      vit(md(0, '06:00'), '98/60', '108', '20', '36.6', '97', '3'),
      vit(md(0, '09:00'), '112/70', '92', '18', '36.6', '98', '2'),
    ],
    io: [
      { time: `${dt(-1)} D`, intake: 'IV 1,500 / pRBC 600', output: '소변 900 / 흑색변 1회', note: '금식' },
      { time: `${dt(-1)} E`, intake: 'IV 800', output: '소변 600 / 흑색변 1회', note: '' },
      { time: `${dt(0)} N`, intake: 'IV 1,000', output: '소변 750', note: '대변 없음' },
    ],
    labs: [
      { name: 'Hb', value: '7.2', unit: 'g/dL', min: '13', max: '17', sample: 'Blood', time: md(-2, '14:30') },
      { name: 'Hb', value: '8.4', unit: 'g/dL', min: '13', max: '17', sample: 'Blood', time: md(-1, '11:00') },
      { name: 'Hb', value: '6.8', unit: 'g/dL', min: '13', max: '17', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Hct', value: '21.8', unit: '%', min: '40', max: '52', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Plt', value: '248', unit: '10^3/uL', min: '150', max: '400', sample: 'Blood', time: md(0, '05:30') },
      { name: 'BUN', value: '32', unit: 'mg/dL', min: '8', max: '21', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Creatinine', value: '0.9', unit: 'mg/dL', min: '0.7', max: '1.3', sample: 'Blood', time: md(0, '05:30') },
      { name: 'PT (INR)', value: '1.02', unit: '', min: '0.9', max: '1.2', sample: 'Blood', time: md(0, '05:30') },
      { name: 'CLO test', value: 'Positive', unit: '', min: '', max: '', sample: 'Biopsy', time: md(-2, '17:00') },
    ],
    notes: [
      { time: md(0, '10:50'), focus: '출혈', text: 'S)\n"어지러운 건 덜한데 아직 힘이 없어요."\n\nO)\n수혈 전 BP 112/70, HR 92, BT 36.6. 대변 오늘 없음, 구토 없음. 결막 창백. Hb 6.8.\n\nA)\n재출혈 의심 징후는 없으나 Hb 감소로 추가 수혈 시행.\n\nI)\npRBC 1 unit 10:40 시작(2인 확인), 시작 후 15분 활력징후 측정함. 출혈 징후 시 바로 알리도록 설명함.\n\nE)\n수혈 반응 증상을 설명하고 환자가 이해함.', author: '박간호', shift: 'D' },
      { time: md(0, '04:20'), focus: '활력징후 변화', text: 'D)\n04:00 BP 96/58, HR 112, 어지럼 호소. 흑색변은 없음.\n\nA)\nTrendelenburg에 가까운 하지 거상 자세 취하고 주치의에게 notify, 수액 속도 증가 지시 시행, 채혈(Hb) 시행함.\n\nR)\n06:00 BP 98/60, HR 108로 서서히 안정. 05:30 Hb 6.8 결과 보고함.', author: '최간호', shift: 'N' },
      { time: md(-1, '20:30'), focus: '금식', text: 'D)\n금식 이틀째, 배고프다고 하며 물을 마시고 싶어함. 입 마름 호소.\n\nA)\n금식 이유 재설명, 구강 간호 시행 및 가글, 입술에 윤활제 도포함.\n\nR)\n불편감 감소, 금식 지시 이해함.', author: '김간호', shift: 'E' },
    ],
    care: [
      { dx: '체액부족 위험성', data: 'melena, Hb 6.8, BP 96/58, HR 112, 금식', goal: '48시간 내 SBP 100 이상, HR 100 이하, 재출혈 없음', plan: '활력징후 q2h, 출혈 징후 관찰, 수혈·수액, I&O, 금식 유지', eval: '부분 달성. BP 112/70, HR 92.' },
      { dx: '불안', data: '"암이면 어떡하죠." 검은 변과 수혈에 대한 두려움, 가족력(위암)', goal: '48시간 내 불안이 줄었다고 말함', plan: '설명과 지지, 내시경 결과(암 아님) 재설명, 질문 시간 확보', eval: '진행 중.' },
      { dx: '지식부족', data: 'NSAIDs와 음주의 위험을 모름, H. pylori 제균 약물을 모름', goal: '퇴원 전 NSAIDs·음주 위험과 제균 요법 지침을 설명할 수 있음', plan: 'NSAIDs 중단, 금주·금연 교육, 제균 요법 7~14일 복용 방법', eval: '' },
    ],
    lines: [
      { kind: 'IV catheter', site: 'Rt. 전완 18G', ins: dt(-2), chg: dt(1), out: '', st: '유지', note: '수혈 전용' },
      { kind: 'IV catheter', site: 'Lt. 전완 20G', ins: dt(-2), chg: dt(1), out: '', st: '유지', note: 'PPI 지속 주입' },
    ],
    iv: [
      { time: '09:00', fluid: 'Pantoprazole 80mg + N/S 100mL', rate: '10', remain: '80', site: 'Lt. 전완 20G', st: '주입 중', by: '박간호' },
      { time: '06:00', fluid: '0.9% N/S 1L', rate: '150', remain: '600', site: 'Rt. 전완 18G', st: '주입 중', by: '최간호' },
    ],
    edu: [
      { time: md(0, '14:00'), topic: '수혈 중 이상 반응 증상과 호출 방법', target: '환자', method: '구두', under: '충분', by: '박간호' },
      { time: md(-1, '15:00'), topic: '금식 이유와 구강 간호', target: '환자', method: '구두', under: '충분', by: '김간호' },
    ],
    specimen: [
      { time: md(0, '05:30'), test: 'CBC, BMP, PT/aPTT', tube: 'EDTA', st: '결과', by: '최간호' },
      { time: md(0, '11:30'), test: 'Hb 재검 (수혈 후)', tube: 'EDTA', st: '접수', by: '박간호' },
    ],
    transport: [
      { time: md(-2, '15:40'), from: '응급실', to: '내시경실', mode: '침대', escort: '응급실 간호사', st: '복귀' },
    ],
    moves: [
      { time: md(-2, '18:30'), type: '전동', from: '응급실', to: '71병동 704호', reason: '위장관 출혈 입원' },
    ],
    transfusion: [
      { time: md(0, '10:30'), step: '확인', blood: 'pRBC (A+)', bno: '2026-118830', bp: '112/70', pr: '92', rr: '18', bt: '36.6', note: '2인 확인 완료: 박간호, 이간호' },
      { time: md(0, '10:40'), step: '시작', blood: 'pRBC (A+)', bno: '2026-118830', bp: '112/70', pr: '92', rr: '18', bt: '36.6', note: '' },
      { time: md(-1, '08:00'), step: '종료', blood: 'pRBC (A+) x2', bno: '2026-118511, 118512', bp: '106/66', pr: '100', rr: '20', bt: '36.7', note: '2 unit 수혈 완료, 이상 반응 없음' },
    ],
    forms: {
      morse: [morse(md(0, '08:30'), [0, 0, 0, 1, 0, 0])],
      braden: [braden(md(0, '08:30'), [3, 2, 2, 3, 2, 2])],
      pain: [painForm(md(0, '09:30'), '2', '상복부', '쑤심', '간헐적', '공복', '안정', '금식 유지, 안정, PPI 투여 중', '1')],
    },
    handover: [
      { time: md(0, '07:00'), s: '새벽 BP 96/58, HR 112로 하락. Hb 6.8, 추가 수혈 예정', b: '십이지장 궤양 출혈, 내시경 지혈술 후 2일째, 금식', a: '대변 흑색변은 어제 이후 없음, 구토 없음, 05:30 Hb 6.8', r: '10시 pRBC 1 unit 수혈, 6시간 후 Hb, 재출혈 시 notify', author: '최간호' },
    ],
    memos: [
      { time: md(0, '09:10'), type: '진료메모', text: '금식 중 심한 갈증 호소. 보호자가 수혈 설명을 다시 듣고 싶어 함.', author: '오간호', shift: 'D', imp: '1' },
      { time: md(0, '07:00'), type: '인수인계', text: '새벽 저혈압 1회. 금식 중, 대변 색 관찰, 수액 150mL/hr.', author: '최간호', shift: 'N', imp: '1' },
    ],
    consent: [
      consent('입원 동의서', dt(-2), '오소화', '본인', '오병훈'),
      consent('침습적 시술·검사 동의서', dt(-2), '강위장', '본인', '오병훈'),
      consent('수혈 동의서', dt(-2), '오소화', '본인', '오병훈'),
    ],
    imaging: [
      { time: md(-2, '15:30'), name: 'Esophagogastroduodenoscopy (응급)', result: 'Duodenal bulb posterior wall ulcer 1.5cm, Forrest Ib. Hemoclip x3 + epinephrine injection hemostasis. CLO test positive.', st: '판독완료' },
    ],
    nutrition: [
      { time: full(0, '09:30'), text: '금식 3일째. 내시경 후 재출혈 없으면 맑은 유동식부터 시작 예정. 철분 풍부한 식이는 퇴원 시 안내.', author: '영양사' },
    ],
    appts: [
      { date: dt(14), time: '10:00', dept: 'GE', doc: '오소화', purpose: '퇴원 후 외래 (제균 요법 확인, 빈혈 추적)', st: '예약' },
    ],
    history: [
      { dept: 'GE', date: dt(-120), dx: 'Gastritis', code: 'K29.7', kind: '외래' },
    ],
  },
};
