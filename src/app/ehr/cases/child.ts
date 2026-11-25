import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, morse, braden, consent, mar } from './h';

export const child: Sample = {
  key: 'child',
  subject: '아동',
  title: '아동 · RSV 세기관지염',
  data: {
    info: {
      sampleKey: 'child', bed: '501-1', ptNo: '0002', name: '김서준', ageSex: '8M/M', ward: '51병동', dept: 'PD', doctor: '박소아', admit: dt(-3), orderDate: dt(0),
      allergy: '무', dx: 'Acute bronchiolitis (RSV)', height: '70', weight: '8.2', iso: '접촉', npo: '0', surg: '0',
      cc: '기침, 쌕쌕거림, 수유량 감소', onset: dt(-5),
      hpi: '5일 전부터 콧물과 기침이 있었고 3일 전부터 숨쉴 때 쌕쌕거리는 소리와 함께 분유 수유량이 평소의 절반으로 줄고 보채 응급실 내원함. RSV 항원 양성, 흉부 X선상 Both 과팽창으로 입원함. 어린이집 형이 감기 증상이 있었음.',
      pmh: '재태주수 39주, 출생체중 3.3kg, 정상 질식분만, 예방접종 일정 준수', fh: '형(4세) 천식(무), 부) 알레르기 비염', social: '부모, 형과 거주 / 주 양육자는 어머니', drink: '', smoke: '아버지 흡연(실외)',
      pe: '입원 시: 체온 38.0 (℃)  맥박 168 (/min)  호흡 58 (/min)  SpO2 91% (room air)\nGeneral: Irritable  Chest: diffuse wheezing, subcostal retraction, nasal flaring',
      plan: '- 산소 요법(SpO2 92% 이상), 비강 흡인, 수액 및 수유 지원\n- 접촉·비말 격리, 손 위생\n- 호흡곤란 진행 시 고유량 비강캐뉼라 고려',
      route: '응급실', method: '안김', informant: '보호자(어머니)', job: '', religion: '무교', marital: '', lang: '한국어', purpose: 'treatment', insight: '',
      bedsore: '', fall: '', pain: 'FLACC 0',
      disDate: dt(2), disMethod: '안김', disPlace: '자택', disGuardian: '어머니', disTarget: '어머니, 아버지', dcEdu: '',
    },
    progress: [
      { time: full(0, '09:20'), dept: 'PD', text: 'S) 밤새 기침은 하나 보채는 것은 줄고 분유 120mL씩 먹음 (평소 150mL).\nO) BT 37.2, HR 138, RR 44, SpO2 96% (room air). 흡기 시 함몰 호전, wheezing 감소. 체중 8.2kg (입원 시 8.0).\nA) RSV 세기관지염, 호전 중 (발병 5일째)\nP) 산소 중단 유지, 수액 감량 후 중단 고려, 내일 퇴원 가능성 평가.', author: '박소아' },
      { time: full(-1, '10:00'), dept: 'PD', text: 'S) 수유량 아직 적고 밤에 숨이 차 보임.\nO) BT 37.6, HR 152, RR 52, SpO2 93% (0.5L NC). Retraction 경미.\nA) RSV 세기관지염 경과 관찰\nP) 산소 유지, 비강 흡인 q4h 및 PRN, 수액 유지, 수유 소량 자주.', author: '박소아' },
      { time: full(-3, '19:00'), dept: 'PD', text: '입원 시 평가: 38.0℃, HR 168, RR 58, SpO2 91% (RA), 함몰·비익 확장 있음. 산소 시작, 수액 유지, 접촉·비말 격리.', author: '유어린' },
    ],
    orders: [
      sec('▶ 기본처방 ◀'),
      od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'),
      od('Check I/O q [8] hrs (diaper weight)', '', '', '', '', '', [], '1'),
      od('Check BW daily', '', '', '', '', '', [], '1'),
      od('Contact·Droplet isolation (RSV)', '', '', '', '', '집계완료', [], '1'),
      od('Nasal suction q [4] hrs & PRN', '', '', '', '', '', [], '1'),
      memo('※ 수유 전 흡인. SpO2 92% 미만 시 흡인 후 재측정.'),
      od('Pulse oximeter continuous monitoring', '', '', '', '', '', [], '1'),
      sec('▶ 식사 처방 ◀'),
      od('Formula small frequent feeding (120~150mL q3~4h)', '', '', '', '', '집계완료'),
      sec('▶ 주사약 ◀'),
      od('5% DW + 0.45% N/S 500mL (유지 수액)', '', '', '', 'IV', '집계완료', ['06:00/최'], '1'),
      memo('※ 33mL/hr (체중 8.2kg, 유지량). 수유량 늘면 감량.'),
      sec('▶ 흡입 ◀'),
      od('3% NaCl 4mL nebulizer', '4', 'mL', '3회', 'Inh', '집계완료', ['06:00/최', '14:00/박', '22:00/'], '1'),
      sec('▶ 약주사 PRN ◀'),
      od('Acetaminophen susp 120mg/5mL (타이레놀 시럽)', '5', 'mL', '', 'PO', '', [], '', 'PRN'),
      memo('※ BT 38.5℃ 이상 시. 용량 15mg/kg = 약 123mg = 5mL (체중 8.2kg). 최소투여간격 6시간.'),
      sec('▶ 검 사 ◀'),
      od('RSV antigen', '', '', '', '', '집계완료', [], '1'),
      od('CBC, CRP', '', '', '', '', '접수'),
    ],
    mar: [
      mar(full(0, '09:05'), '3% NaCl 4mL nebulizer', '4mL', 'Inh', '09:00', '박간호'),
      mar(full(-1, '21:40'), 'Acetaminophen susp 120mg/5mL (타이레놀 시럽)', '5mL', 'PO', 'PRN', '김간호', { note: 'BT 38.7℃, 용량 체중 확인(8.2kg × 15mg) 후 투여, 1시간 후 37.9℃' }),
    ],
    vitals: [
      vit(md(-3, '19:00'), '86/50', '168', '58', '38.0', '91', '0'),
      vit(md(-3, '23:00'), '84/48', '162', '56', '37.8', '93', '0'),
      vit(md(-2, '07:00'), '88/52', '158', '54', '37.6', '94', '0'),
      vit(md(-2, '15:00'), '90/54', '156', '54', '37.5', '94', '0'),
      vit(md(-1, '07:00'), '88/50', '152', '52', '37.6', '93', '0'),
      vit(md(-1, '15:00'), '90/52', '150', '50', '37.8', '94', '0'),
      vit(md(-1, '21:30'), '92/54', '170', '56', '38.7', '92', '0'),
      vit(md(-1, '22:40'), '88/50', '150', '50', '37.9', '94', '0'),
      vit(md(0, '07:00'), '90/52', '140', '46', '37.3', '96', '0'),
      vit(md(0, '09:00'), '88/50', '138', '44', '37.2', '96', '0'),
    ],
    io: [
      { time: `${dt(-2)} D`, intake: 'PO 450 / IV 600', output: '소변 520', note: '기저귀 무게 측정, 수유량 평소의 50%' },
      { time: `${dt(-1)} D`, intake: 'PO 650 / IV 500', output: '소변 640', note: '수유 시 보챔' },
      { time: `${dt(0)} N`, intake: 'PO 500 / IV 350', output: '소변 520', note: '기저귀 6회 / 소변량 양호' },
    ],
    labs: [
      { name: 'WBC', value: '11.4', unit: '10^3/uL', min: '6.0', max: '17.5', sample: 'Blood', time: md(-3, '19:30') },
      { name: 'CRP', value: '0.8', unit: 'mg/dL', min: '0', max: '0.5', sample: 'Blood', time: md(-3, '19:30') },
      { name: 'Hb', value: '11.2', unit: 'g/dL', min: '10.5', max: '13.5', sample: 'Blood', time: md(-3, '19:30') },
      { name: 'Na', value: '137', unit: 'mmol/L', min: '135', max: '145', sample: 'Blood', time: md(-3, '19:30') },
      { name: 'RSV antigen', value: 'Positive', unit: '', min: '', max: '', sample: 'Nasopharyngeal', time: md(-3, '18:20') },
    ],
    notes: [
      { time: md(0, '09:30'), focus: '비효율적 기도청결', text: 'S)\n보호자: "밤에는 콧물 때문에 숨쉬기 힘들어 보였는데 아침엔 편해 보여요."\n\nO)\nRR 44, SpO2 96% (room air), 함몰 경미, 콧물 맑고 중등도. 수유 전 비강 흡인 시 점액 소량 배출.\n\nA)\n콧물 제거 후 호흡 상태 호전됨.\n\nI)\n생리식염수 점적 후 비강 흡인 시행, 상체를 30도 올린 자세 유지, 흡인 방법을 보호자에게 시범함.\n\nE)\n어머니가 점적과 흡인 순서를 시범 보이고 아기가 편안해함.', author: '박간호', shift: 'D' },
      { time: md(-1, '21:50'), focus: '체온상승', text: 'D)\n21:30 BT 38.7℃, HR 170, 보챔. 얼굴 홍조.\n\nA)\n옷을 얇게 하고 실내 온도 조절, 의사 처방에 따라 acetaminophen 5mL(120mg) 투여(체중 8.2kg × 15mg/kg = 123mg 확인), 수분 보충 위해 수유 시도함.\n\nR)\n22:40 BT 37.9℃, HR 150으로 감소, 보채는 것 줄어듦.', author: '김간호', shift: 'E' },
      { time: md(-2, '09:30'), focus: '수유', text: 'D)\n분유 150mL 중 70mL 먹고 숨이 차 보채며 중단함. 수유 시 SpO2 91%로 저하.\n\nA)\n수유 전 비강 흡인, 소량씩 자주(90mL × 8회) 수유하도록 조정, 수유 중 휴식 시간 갖고 SpO2 모니터링함.\n\nR)\n90mL 분유 섭취, SpO2 94% 유지. 어머니가 소량 자주 수유 이유를 설명함.', author: '박간호', shift: 'D' },
    ],
    care: [
      { dx: '비효율적 기도청결', data: '콧물·점액 증가, 쌕쌕거림, 함몰, RR 58, SpO2 91%', goal: '48시간 내 RR 40 이하, 함몰 소실', plan: '비강 점적·흡인, 반 좌위, 산소 모니터링, 거담 흡입(3% NaCl)', eval: '진행 중. RR 44, 함몰 경미.' },
      { dx: '체액부족 위험성', data: '수유량 평소의 50%, 발열, 빈호흡, 기저귀 소변량 감소', goal: '48시간 내 기저귀 6회 이상, 체중 감소 없음', plan: '소량 자주 수유, 수액 유지, I&O(기저귀 무게), 체중 측정', eval: '달성. 기저귀 6회, 체중 8.2kg.' },
      { dx: '체온상승', data: 'BT 38.7℃, 홍조, HR 170', goal: '1시간 내 BT 38.0℃ 이하', plan: '체온 측정, 옷 조절, 해열제(체중 기준 용량), 수분 보충', eval: '달성. 1시간 후 37.9℃.' },
      { dx: '불안', data: '어머니가 아기가 숨쉬기 힘들어하는 모습에 우는 모습, 질문 많음', goal: '48시간 내 어머니가 불안이 줄었다고 표현', plan: '경과 설명, 질문 시간 확보, 흡인·수유 참여 격려', eval: '부분 달성.' },
      { dx: '감염 위험성', data: 'RSV 양성, 격리 중, 가족 방문', goal: '병동 내 전파 없음', plan: '접촉·비말 격리, 손 위생, 면회 제한(1인), 장난감 공유 금지 교육', eval: '진행 중.' },
    ],
    lines: [
      { kind: 'IV catheter', site: 'Lt. 손등 24G', ins: dt(-3), chg: dt(1), out: '', st: '유지', note: '부목 고정, 발적·부종 없음' },
    ],
    iv: [
      { time: '06:00', fluid: '5% DW + 0.45% N/S 500mL', rate: '33', remain: '250', site: 'Lt. 손등 24G', st: '주입 중', by: '최간호' },
    ],
    edu: [
      { time: md(0, '11:00'), topic: '비강 점적·흡인 방법과 수유 전 시행', target: '보호자', method: '시범', under: '충분', by: '박간호' },
      { time: md(-1, '14:00'), topic: '손 위생과 접촉 격리 지침', target: '보호자', method: '구두', under: '충분', by: '김간호' },
      { time: md(-2, '16:00'), topic: '해열제 용량(체중 기준)과 투여 간격', target: '보호자', method: '유인물', under: '보통', by: '박간호' },
    ],
    specimen: [
      { time: md(-3, '18:20'), test: 'RSV antigen (비인두 도말)', tube: '기타', st: '결과', by: '응급실' },
      { time: md(-3, '19:30'), test: 'CBC, CRP, BMP', tube: 'EDTA', st: '결과', by: '응급실' },
    ],
    transport: [
      { time: md(-3, '20:30'), from: '응급실', to: '51병동 503호', mode: '안김', escort: '응급실 간호사', st: '도착' },
    ],
    moves: [
      { time: md(-3, '20:30'), type: '전동', from: '응급실', to: '51병동 503호', reason: '세기관지염 입원' },
    ],
    forms: {
      morse: [],
      braden: [],
    },
    handover: [
      { time: md(0, '07:00'), s: '밤새 열 없음(어제 21:30 38.7℃ 1회), 새벽 수유 150mL 중 100mL', b: 'RSV 세기관지염 입원 4일차, 접촉·비말 격리, 체중 8.2kg', a: 'RR 44~46, SpO2 96% (RA), 함몰 경미, 소변 양호', r: '오전 수유 전 비강 흡인, 산소 중단 후 SpO2 모니터링, 수액 감량 여부 회진 확인', author: '최간호' },
    ],
    memos: [
      { time: md(0, '09:40'), type: '진료메모', text: '보호자가 수유량 감소를 걱정함. 퇴원 후 어린이집 등원 시기 문의함.', author: '김간호', shift: 'D' },
      { time: md(-1, '22:00'), type: '간호메모', text: '21:30 발열 38.7℃, acetaminophen 5mL(120mg, 체중 8.2kg 기준) 투여 후 37.9℃. 보호자에게 용량 설명함.', author: '김간호', shift: 'E', imp: '1' },
    ],
    consent: [
      consent('입원 동의서', dt(-3), '박소아', '법정대리인', '이수진', '모'),
      consent('개인정보 수집·이용 동의서', dt(-3), '박소아', '법정대리인', '이수진', '모'),
    ],
    imaging: [
      { time: md(-3, '18:40'), name: 'Chest X-ray (AP)', result: 'Bilateral hyperinflation, peribronchial thickening. No focal consolidation.', st: '판독완료' },
    ],
    nutrition: [
      { time: full(-2, '10:00'), text: '영유아 영양: 분유 수유, 체중 8.2kg (성장곡선 50~75 백분위). 수유량 감소로 열량 보충을 위해 소량 자주 수유. 이유식은 호흡 안정 후 재개.', author: '영양사' },
    ],
    appts: [
      { date: dt(7), time: '10:00', dept: 'PD', doc: '박소아', purpose: '퇴원 후 외래 (호흡기 증상 확인)', st: '예약' },
    ],
    history: [
      { dept: 'PD', date: dt(-120), dx: 'Acute nasopharyngitis', code: 'J00', kind: '외래' },
    ],
  },
};
