import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, consent } from './h';

export const op1: Sample = {
  key: 'op1',
  subject: '외래',
  title: '외래 · 제2형 당뇨 추적관찰',
  data: {
    info: {
      sampleKey: 'op1', ptNo: '00000011', name: '강대호', ageSex: '58/M', ward: '외래', dept: 'EN', doctor: '서내분', admit: dt(0), visitTime: '09:30', vstatus: '진료중', orderDate: dt(0),
      allergy: '무', dx: 'Type 2 diabetes mellitus with peripheral neuropathy', height: '170', weight: '74.0', iso: '없음', npo: '0', surg: '0',
      cc: '정기 추적, 식후 어지럼, 발 저림', onset: dt(-60),
      hpi: '당뇨 8년. 3개월마다 외래 방문 중이며 최근 2개월간 식후 2~3시간 뒤 어지럽고 손에 땀이 나는 증상이 가끔 있고 양 발끝이 저리다고 호소함. 식사량은 줄이지 않았으나 최근 저녁에 약을 먹고 식사를 거르는 날이 있음.',
      pmh: '당뇨(유) 8년, 고혈압(유), 이상지질혈증(유)', fh: '모) 당뇨', social: '버스 기사, 불규칙한 식사', drink: '가끔', smoke: '무',
      pe: '혈압 134/84 (mmHg)  맥박 76 (/min)  호흡 16 (/min)  체온 36.5 (℃)  체중 74kg  BMI 25.6\n발: 족배동맥 촉지, monofilament 감각 저하(양측 족저부), 발 피부 균열 없음',
      plan: '- HbA1c, 공복혈당, 신기능, 소변 알부민 검사\n- 저혈당 증상 교육, 식사 거르지 않기, 약 용량 조정 검토\n- 발 관리 교육, 안과 진료 의뢰\n- 3개월 후 외래',
      route: '외래', method: '보행', informant: '환자', job: '버스 기사', religion: '무교', marital: '기혼', lang: '한국어', purpose: 'treatment', insight: '유', pain: 'NRS 0',
    },
    progress: [
      { time: full(0, '09:50'), dept: 'EN', text: 'S) 식후 어지럽고 손에 땀이 난 적이 두 번 있음. 발끝이 저림.\nO) BP 134/84, HR 76, BMI 25.6. 외래 혈당 (식전) 168 mg/dL. 족저 monofilament 감각 저하.\nA) T2DM, 저혈당 의심 증상 + 말초신경병증\nP) HbA1c 등 채혈 후 결과 보고 약 용량 조정. 저혈당 교육. 안과 진료 의뢰.', author: '서내분' },
    ],
    orders: [
      sec('▶ 처방 ◀'),
      od('Metformin 500mg (다이아벡스)', '1', 'T', '2회', 'PO', '집계완료', [], '', ''),
      od('Glimepiride 2mg (아마릴)', '1', 'T', '1회', 'PO', '집계완료'),
      memo('※ 아침 식전. 식사를 거르면 복용하지 않도록 교육'),
      od('Amlodipine 5mg (노바스크)', '1', 'T', '1회', 'PO', '집계완료'),
      od('Atorvastatin 20mg (리피토)', '1', 'T', '1회', 'PO', '집계완료'),
      od('Glimepiride 4mg (아마릴)', '1', 'T', '1회', 'PO', '', [], '', 'D/C'),
      memo('※ 저혈당 증상으로 2mg로 감량, 이전 처방 D/C'),
      sec('▶ 검 사 ◀'),
      od('HbA1c, 공복혈당', '', '', '', '', '접수'),
      od('BUN/Cr, eGFR, 소변 알부민/크레아티닌 비', '', '', '', '', '접수'),
      od('Lipid profile', '', '', '', '', '접수'),
      od('안과 협진 (당뇨망막병증 선별)', '', '', '', '', '접수'),
    ],
    mar: [],
    vitals: [vit(md(0, '09:35'), '134/84', '76', '16', '36.5', '98', '0')],
    io: [],
    labs: [
      { name: 'HbA1c', value: '8.2', unit: '%', min: '4.0', max: '6.0', sample: 'Blood', time: md(-90, '08:30') },
      { name: 'Glucose (fasting)', value: '152', unit: 'mg/dL', min: '70', max: '110', sample: 'Blood', time: md(-90, '08:30') },
      { name: 'Creatinine', value: '0.9', unit: 'mg/dL', min: '0.7', max: '1.3', sample: 'Blood', time: md(-90, '08:30') },
      { name: 'LDL-C', value: '112', unit: 'mg/dL', min: '0', max: '100', sample: 'Blood', time: md(-90, '08:30') },
      { name: 'Glucose (random)', value: '168', unit: 'mg/dL', min: '70', max: '140', sample: 'Blood', time: md(0, '09:40') },
    ],
    notes: [
      { time: md(0, '10:10'), focus: '저혈당 교육', text: 'S)\n"저녁에 약 먹고 밥을 못 먹은 날 어지럽고 식은땀이 났어요."\n\nO)\n외래 혈당 168 mg/dL. 저혈당 증상(어지럼, 식은땀, 손 떨림)을 구체적으로 구분하지 못함.\n\nA)\n저혈당 증상과 대처 방법에 대한 지식이 부족함.\n\nI)\n저혈당 증상, 15-15 규칙(당 15g 섭취 후 15분 뒤 재측정), 식사 거르면 약 복용하지 않기 교육함. 사탕·주스를 항상 휴대하도록 안내함.\n\nE)\n환자가 저혈당 증상 3가지와 15-15 규칙을 정확히 설명함.', author: '이간호', shift: 'D' },
      { time: md(0, '10:30'), focus: '발 관리', text: 'D)\nmonofilament 감각 저하, 발 피부 건조, 발톱 정리 방법을 정확히 모름.\n\nA)\n매일 발 점검(거울 사용), 보습, 맨발 금지, 적당한 신발 선택, 발톱은 일자로 자르기 교육함.\n\nR)\n환자가 매일 점검하겠다고 말하고 방법을 시범 보임.', author: '이간호', shift: 'D' },
    ],
    care: [
      { dx: '지식부족', data: '저혈당 증상을 구분하지 못함, 식사를 거르고 약 복용, 발 관리 방법 모름', goal: '내원 당일 저혈당 증상과 대처, 발 관리 방법을 설명', plan: '저혈당 교육(15-15 규칙), 식사·약 복용 시간 조정 교육, 발 관리 교육, 자가혈당 측정 방법 시범', eval: '달성. teach-back으로 확인함.' },
    ],
    edu: [
      { time: md(0, '10:10'), topic: '저혈당 증상과 15-15 규칙', target: '환자', method: '구두', under: '충분', by: '이간호' },
      { time: md(0, '10:30'), topic: '당뇨발 관리 (매일 점검, 보습, 신발)', target: '환자', method: '시범', under: '충분', by: '이간호' },
      { time: md(0, '10:40'), topic: '자가혈당 측정 방법과 기록', target: '환자', method: '시범', under: '보통', by: '이간호' },
    ],
    specimen: [
      { time: md(0, '10:00'), test: 'HbA1c, 공복혈당, 지질, 신기능, 소변 알부민', tube: 'EDTA', st: '채취', by: '채혈실' },
    ],
    consult: [
      { date: dt(0), dept: 'EN', doc: '서내분', req: '당뇨망막병증 선별 안저검사 의뢰', rdept: 'OPH', reply: '', st: '미회신' },
    ],
    nutrition: [
      { time: full(0, '10:45'), text: '규칙적인 식사(하루 3끼), 야간 근무 시 간식 계획(복합당질 + 단백질) 교육. 탄수화물 교환 단위 안내.', author: '영양사' },
    ],
    appts: [
      { date: dt(14), time: '09:30', dept: 'EN', doc: '서내분', purpose: '검사 결과 확인 및 약 조정', st: '예약' },
      { date: dt(21), time: '14:00', dept: 'OPH', doc: '', purpose: '안저검사 (당뇨망막병증 선별)', st: '예약' },
      { date: dt(90), time: '09:30', dept: 'EN', doc: '서내분', purpose: '3개월 추적', st: '예약' },
    ],
    memos: [
      { time: md(0, '09:55'), type: '진료메모', text: '검사 결과 확인 후 14일 뒤 약 조정. 저혈당 증상 지속되면 즉시 내원 안내.', author: '서내분', shift: 'D' },
    ],
    history: [
      { dept: 'EN', date: dt(-90), dx: 'Type 2 diabetes mellitus', code: 'E11.9', kind: '외래' },
      { dept: 'EN', date: dt(-180), dx: 'Type 2 diabetes mellitus', code: 'E11.9', kind: '외래' },
    ],
  },
};

export const op2: Sample = {
  key: 'op2',
  subject: '외래',
  title: '외래 · 담낭절제술 후 1주 경과 관찰',
  data: {
    info: {
      sampleKey: 'op2', ptNo: '00000012', name: '문선영', ageSex: '45/F', ward: '외래', dept: 'GS', doctor: '장일반', admit: dt(0), visitTime: '10:20', vstatus: '접수', orderDate: dt(0),
      allergy: '무', dx: 'POD#7, laparoscopic cholecystectomy (acute cholecystitis)', height: '160', weight: '58.0', iso: '없음', npo: '0', surg: '1',
      cc: '수술 후 경과 관찰, 우측 상복부 불편감', onset: dt(-8),
      hpi: '7일 전 급성 담낭염으로 복강경 담낭절제술 시행 후 퇴원함. 상처 통증은 경미하고 발열은 없으나 기름진 음식 후 우측 상복부가 더부룩하고 묽은 변을 하루 2회 봄.',
      pmh: '특이사항 무', fh: '무', social: '직장인', drink: '무', smoke: '무',
      pe: '혈압 118/74 (mmHg)  맥박 72 (/min)  호흡 16 (/min)  체온 36.6 (℃)\nAbdomen: soft, port 부위 상처 건조·청결, 압통 없음',
      plan: '- 상처 확인 및 실밥(skin glue) 상태 확인\n- 병리 결과 설명\n- 식이 지도(저지방), 증상 악화 시 내원',
      route: '외래', method: '보행', informant: '환자', job: '회사원', religion: '기독교', marital: '기혼', lang: '한국어', purpose: 'treatment', insight: '유', pain: 'NRS 1',
    },
    progress: [
      { time: full(0, '10:40'), dept: 'GS', text: 'S) 상처는 거의 안 아픔. 기름진 음식 먹은 후 더부룩하고 묽은 변 하루 2회.\nO) BT 36.6, 4개 port 상처 모두 건조, 발적·삼출 없음, 우측 상복부 압통 없음. 병리: chronic and acute cholecystitis, no malignancy.\nA) POD#7, 경과 양호, 담낭절제술 후 설사(식이 관련)\nP) 저지방 소량 자주 식사 2주, 증상 지속 시 재방문. 2주 후 외래 또는 필요 시.', author: '장일반' },
    ],
    orders: [
      sec('▶ 처방 ◀'),
      od('Acetaminophen 650mg (타이레놀)', '1', 'T', '', 'PO', '집계완료', [], '', 'PRN'),
      memo('※ 통증 시 하루 최대 3회'),
      od('Ursodeoxycholic acid 100mg (우루사)', '1', 'T', '3회', 'PO', '집계완료'),
      sec('▶ 처치 ◀'),
      od('상처 소독 (4개 port)', '', '', '', '', '집계완료', [], '1'),
    ],
    mar: [],
    vitals: [vit(md(0, '10:25'), '118/74', '72', '16', '36.6', '99', '1')],
    io: [],
    labs: [
      { name: 'WBC', value: '7.2', unit: '10^3/uL', min: '4.0', max: '10.0', sample: 'Blood', time: md(0, '10:00') },
      { name: 'CRP', value: '0.3', unit: 'mg/dL', min: '0', max: '0.5', sample: 'Blood', time: md(0, '10:00') },
      { name: 'AST', value: '24', unit: 'U/L', min: '0', max: '40', sample: 'Blood', time: md(0, '10:00') },
      { name: 'ALT', value: '28', unit: 'U/L', min: '0', max: '40', sample: 'Blood', time: md(0, '10:00') },
      { name: 'T-bili', value: '0.7', unit: 'mg/dL', min: '0.2', max: '1.2', sample: 'Blood', time: md(0, '10:00') },
    ],
    notes: [
      { time: md(0, '11:00'), focus: '퇴원 후 식이', text: 'S)\n"기름진 음식 먹으면 더부룩하고 화장실을 자주 가요."\n\nO)\n하루 묽은 변 2회, 발열·황달 없음, 상처 청결.\n\nA)\n담낭절제술 후 지방 소화 변화에 대한 식이 지식이 부족함.\n\nI)\n저지방·소량 자주 식사, 튀김·기름진 음식 제한, 점차 정상식 진행, 설사 시 수분 섭취, 발열·황달·심한 복통 시 즉시 내원 교육함.\n\nE)\n환자가 피해야 할 음식 3가지와 즉시 내원해야 할 증상을 설명함.', author: '이간호', shift: 'D' },
    ],
    care: [
      { dx: '지식부족', data: '담낭절제술 후 식이 변화와 주의 증상을 모름', goal: '내원 당일 식이 방법과 응급 증상을 설명', plan: '저지방 식이 교육, 설사 대처, 위험 징후 교육', eval: '달성.' },
    ],
    wounds: [
      { time: md(0, '10:45'), site: '배꼽 외 4개 port', kind: '수술 상처', size: '0.5~1.2', look: '건조, 발적·부종·삼출 없음, 접착제 일부 박리 중', dress: '노출 (드레싱 불필요)', by: '이간호' },
    ],
    edu: [
      { time: md(0, '11:00'), topic: '담낭절제술 후 저지방 식이와 단계적 식사 진행', target: '환자', method: '유인물', under: '충분', by: '이간호' },
      { time: md(0, '11:05'), topic: '즉시 내원해야 할 증상 (발열, 황달, 심한 복통, 상처 삼출)', target: '환자', method: '구두', under: '충분', by: '이간호' },
    ],
    specimen: [
      { time: md(0, '10:00'), test: 'CBC, CRP, 간기능', tube: 'SST', st: '결과', by: '채혈실' },
    ],
    consent: [
      consent('개인정보 수집·이용 동의서', dt(-7), '장일반', '본인', '문선영'),
    ],
    surgery: [
      { date: dt(-7), dept: 'GS', name: 'Laparoscopic cholecystectomy', anes: '전신마취', note: '급성 담낭염, 담낭 괴저 없음, 병리 의뢰' },
    ],
    imaging: [
      { time: md(-8, '09:00'), name: 'Abdomen US', result: 'Gallbladder wall thickening with stones, positive sonographic Murphy sign', st: '판독완료' },
    ],
    nutrition: [
      { time: full(0, '11:10'), text: '저지방 식이(지방 30% 이하), 하루 5~6회 소량 식사, 유제품·기름진 고기·튀김 일시 제한, 점차 확대.', author: '영양사' },
    ],
    appts: [
      { date: dt(14), time: '10:00', dept: 'GS', doc: '장일반', purpose: '2주 후 경과 (증상 지속 시)', st: '예약' },
    ],
    memos: [
      { time: md(0, '10:45'), type: '진료메모', text: '병리 결과 설명 완료. 증상 호전 시 추가 방문 불필요.', author: '장일반', shift: 'D' },
    ],
    history: [
      { dept: 'GS', date: dt(-7), dx: 'Acute cholecystitis, s/p lap cholecystectomy', code: 'K81.0', kind: '입원' },
    ],
  },
};
