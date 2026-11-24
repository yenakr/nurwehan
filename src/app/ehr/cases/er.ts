import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, consent, mar } from './h';

export const er1: Sample = {
  key: 'er1',
  subject: '응급',
  title: '응급 · 흉통, 심정지 (KTAS 1)',
  data: {
    info: {
      sampleKey: 'er1', ptNo: '0021', name: '오창수', ageSex: '63/M', ward: '응급실', dept: 'ER', doctor: '배응급', admit: dt(0), visitTime: '14:05', vstatus: '관찰', ktas: '1', zone: '응급', orderDate: dt(0),
      allergy: '무', dx: 'Acute inferior STEMI, ventricular fibrillation arrest, ROSC', height: '171', weight: '78.0', iso: '없음', npo: '1', surg: '0',
      cc: '가슴 답답함, 식은땀, 왼팔 방사통', onset: full(0, '13:15'),
      hpi: '1시간 전 안정 중 갑자기 가슴을 쥐어짜는 통증과 식은땀이 시작되고 왼팔로 뻗쳐 119로 내원함. 도착 후 심전도에서 II, III, aVF ST 상승 확인. 시술 준비 중 심실세동으로 심정지 발생, 제세동 2회 후 자발순환 회복(ROSC).',
      pmh: '고혈압(유) 10년, 이상지질혈증(유), 당뇨(무)', fh: '부) 심근경색 (58세)', social: '자영업', drink: '주 2~3회', smoke: '30갑년, 현재 흡연',
      pe: '도착 시: 혈압 168/98 (mmHg)  맥박 108 (/min)  호흡 22 (/min)  체온 36.7 (℃)  SpO2 95%\nGeneral: Diaphoretic, acutely ill  Chest: clear  Heart: regular, no murmur',
      plan: '- 12유도 ECG, Troponin, 응급 관상동맥조영술(PCI) 준비\n- Aspirin·Clopidogrel, NTG, O2, 헤파린\n- ROSC 후 목표체온관리 고려 및 중환자실 입실',
      route: '119 구급차', method: '들것', informant: '보호자(아내)', pain: 'NRS 8',
    },
    progress: [
      { time: full(0, '14:45'), dept: 'ER', text: 'S) 의식 회복, 가슴 통증 호소(NRS 5).\nO) ROSC 후 BP 98/60 (norepinephrine 시작), HR 92, SpO2 96% (O2 5L), ECG: inferior ST elevation 지속. Troponin I 2.4.\nA) Inferior STEMI + VF arrest, ROSC (심정지 시간 약 6분)\nP) 응급 PCI 위해 심혈관조영실 이동, 심장내과 협진, 중환자실 입실 예정.', author: '배응급' },
      { time: full(0, '14:20'), dept: 'ER', text: '14:10 VF 발생. 즉시 CPR 시작, 제세동 200J x2, epinephrine 1mg x1, amiodarone 300mg 투여 후 14:16 ROSC 확인. 기도 유지(bag-mask), 삽관 불필요.', author: '배응급' },
      { time: full(0, '14:10'), dept: 'ER', text: 'S) 가슴이 쥐어짜듯 아프고 식은땀.\nO) BP 168/98, HR 108, ECG: II, III, aVF ST elevation 3mm, V4-6 ST depression.\nA) Inferior STEMI\nP) Aspirin 300mg, Clopidogrel 600mg, Heparin 4,000U IV, 응급 PCI 협진.', author: '배응급' },
    ],
    orders: [
      sec('▶ 응급 처방 ◀'),
      od('Check V/S q 5min', '', '', '', '', '', [], '1'),
      od('12-lead ECG', '', '', '', '', '집계완료', [], '1'),
      od('Cardiac monitor, defibrillator pad 부착', '', '', '', '', '집계완료', [], '1'),
      od('O2 5L/min mask (SpO2 94% 이상 유지)', '', '', '', '', '', [], '1'),
      od('금식 (NPO)', '', '', '', '', '집계완료'),
      sec('▶ 약물 ◀'),
      od('Aspirin 300mg (아스피린)', '300', 'mg', '1회', 'PO', '집계완료', ['14:12/박'], '1', 'STAT'),
      od('Clopidogrel 300mg (플라빅스)', '600', 'mg', '1회', 'PO', '집계완료', ['14:12/박'], '1', 'STAT'),
      od('Heparin 5000U/5mL (헤파린)', '4000', 'U', '1회', 'IV', '집계완료', ['14:15/박'], '', 'STAT'),
      memo('※ 고위험 약물: 용량 이중확인'),
      od('Nitroglycerin 0.6mg (니트로글리세린)', '0.6', 'mg', '1회', 'SL', '', [], '', 'D/C'),
      memo('※ 하벽 STEMI 우심실 경색 가능성, 저혈압 위험으로 D/C'),
      od('Epinephrine 1mg/mL (에피네프린)', '1', 'mg', '1회', 'IV', '집계완료', ['14:12/박'], '', 'STAT'),
      od('Amiodarone 150mg/3mL (아이오다론)', '300', 'mg', '1회', 'IV', '집계완료', ['14:14/박'], '', 'STAT'),
      od('Norepinephrine 4mg/4mL (노르에피네프린)', '0.1', 'mcg/kg/min', '지속', 'CIV', '집계완료', ['14:25/박'], '', ''),
      sec('▶ 검 사 ◀'),
      od('Troponin I, CK-MB', '', '', '', '', '집계완료', [], '1'),
      od('CBC, BMP, PT/aPTT, ABGA', '', '', '', '', '집계완료', [], '1'),
      od('Chest X-ray portable', '', '', '', '', '집계완료', [], '1'),
    ],
    mar: [
      mar(full(0, '14:12'), 'Aspirin 300mg (아스피린)', '300mg', 'PO', 'STAT', '박간호', { note: '씹어서 복용함' }),
      mar(full(0, '14:12'), 'Clopidogrel 300mg (플라빅스)', '600mg', 'PO', 'STAT', '박간호'),
      mar(full(0, '14:15'), 'Heparin 5000U/5mL (헤파린)', '4000U', 'IV', 'STAT', '박간호', { dbl: '최간호' }),
      mar(full(0, '14:12'), 'Epinephrine 1mg/mL (에피네프린)', '1mg', 'IV', 'STAT', '박간호', { dbl: '최간호', note: 'CPR 중 투여' }),
      mar(full(0, '14:14'), 'Amiodarone 150mg/3mL (아이오다론)', '300mg', 'IV', 'STAT', '박간호', { dbl: '최간호', note: '두 번째 제세동 후 투여' }),
    ],
    vitals: [
      vit(md(0, '14:05'), '168/98', '108', '22', '36.7', '95', '8'),
      vit(md(0, '14:20'), '98/60', '92', '16', '36.6', '96', '5'),
      vit(md(0, '14:30'), '104/62', '90', '18', '36.4', '97', '5'),
      vit(md(0, '14:40'), '110/68', '88', '18', '36.3', '98', '4'),
    ],
    io: [],
    labs: [
      { name: 'Troponin I', value: '0.08', unit: 'ng/mL', min: '0', max: '0.04', sample: 'Blood', time: md(0, '14:10') },
      { name: 'Troponin I', value: '2.4', unit: 'ng/mL', min: '0', max: '0.04', sample: 'Blood', time: md(0, '14:30') },
      { name: 'CK-MB', value: '28', unit: 'ng/mL', min: '0', max: '5', sample: 'Blood', time: md(0, '14:30') },
      { name: 'K', value: '3.4', unit: 'mmol/L', min: '3.5', max: '5.0', sample: 'Blood', time: md(0, '14:30') },
      { name: 'Glucose', value: '184', unit: 'mg/dL', min: '70', max: '110', sample: 'Blood', time: md(0, '14:30') },
      { name: 'Creatinine', value: '1.0', unit: 'mg/dL', min: '0.7', max: '1.3', sample: 'Blood', time: md(0, '14:30') },
      { name: 'ABGA pH', value: '7.28', unit: '', min: '7.35', max: '7.45', sample: 'Blood', time: md(0, '14:30') },
      { name: 'Lactate', value: '4.2', unit: 'mmol/L', min: '0.5', max: '2.2', sample: 'Blood', time: md(0, '14:30') },
    ],
    notes: [
      { time: md(0, '14:50'), focus: '심정지', text: 'D)\n14:10 VF 발생, 의식·호흡 소실, 맥박 촉지 안 됨. 즉시 CPR 시작.\n\nA)\n가슴 압박(분당 100~120회, 깊이 5~6cm) 시행, 제세동 200J x2, epinephrine 1mg IV, amiodarone 300mg IV 투여, bag-mask 환기. 2분마다 리듬 확인 후 압박자 교대.\n\nR)\n14:16 자발순환 회복(ROSC), BP 98/60, HR 92, SpO2 96%. 의식 명료. 응급 PCI 위해 이동 준비.', author: '박간호', shift: 'D' },
      { time: md(0, '14:20'), focus: '흉통', text: 'D)\n14:05 가슴을 쥐어짜는 통증 NRS 8, 식은땀, 왼팔 방사통. BP 168/98, HR 108.\n\nA)\n침상 안정, O2 5L mask 적용, 12-lead ECG 시행, IV 2개 확보, 처방 약물(aspirin, clopidogrel) 투여 후 의사 확인.\n\nR)\nECG 결과 하벽 ST 상승 확인되어 심장내과 응급 콜. 통증 지속.', author: '박간호', shift: 'D' },
    ],
    care: [
      { dx: '심박출량 감소', data: 'VF 심정지, ROSC 후 BP 98/60, 혈중 젖산 4.2', goal: '이송 전까지 SBP 90 이상, 부정맥 재발 없음', plan: '심전도 모니터, 승압제 지속, 제세동기 대기, 활력징후 q5min, 심혈관조영실 인계', eval: '진행 중.' },
      { dx: '불안', data: '"죽는 줄 알았어요." 아내가 울고 있음', goal: '환자와 보호자가 상황을 이해하고 불안을 표현', plan: '검사·시술 계획 설명, 보호자에게 대기 장소 안내와 지지', eval: '진행 중.' },
    ],
    lines: [
      { kind: 'IV catheter', site: '우측 전완 18G', ins: dt(0), chg: dt(3), out: '', st: '유지', note: '응급 약물 투여' },
      { kind: 'IV catheter', site: '좌측 전완 18G', ins: dt(0), chg: dt(3), out: '', st: '유지', note: '수액·승압제' },
    ],
    iv: [
      { time: '14:25', fluid: 'Norepinephrine 4mg + D5W 250mL', rate: '10', remain: '230', site: '좌측 전완 18G', st: '주입 중', by: '박간호' },
    ],
    edu: [
      { time: md(0, '14:55'), topic: '시술(PCI)의 목적과 과정, 보호자 대기 안내', target: '환자·보호자', method: '구두', under: '보통', by: '박간호' },
    ],
    specimen: [
      { time: md(0, '14:10'), test: 'Troponin I, CK-MB, CBC, BMP, PT/aPTT', tube: 'SST', st: '결과', by: '박간호' },
      { time: md(0, '14:30'), test: 'ABGA, Lactate', tube: 'Heparin', st: '결과', by: '박간호' },
    ],
    transport: [
      { time: md(0, '14:50'), from: '응급실', to: '심혈관조영실', mode: '침대', escort: '의사, 응급실 간호사 (모니터·제세동기 동반)', st: '이송 중' },
    ],
    moves: [
      { time: md(0, '15:10'), type: '전과', from: 'ER', to: 'CV', reason: 'STEMI, 응급 PCI 및 중환자실 입실' },
    ],
    cpr: [
      { time: '14:10:00', ev: '의식·호흡 없음 확인', detail: '심전도 모니터상 VF, 맥박 촉지 안 됨. 응급 콜 요청(코드 블루).', by: '박간호' },
      { time: '14:10:20', ev: 'CPR 시작', detail: '가슴 압박 시작, 제세동기 패드 부착, 백밸브마스크 환기 30:2', by: '박간호' },
      { time: '14:11:30', ev: '제세동', detail: 'VF 확인, 200J biphasic 1회 시행, 즉시 CPR 재개', by: '배응급' },
      { time: '14:12:00', ev: 'Epinephrine 1mg', detail: 'IV 우측 전완, 이후 3~5분마다 반복 계획', by: '박간호' },
      { time: '14:13:40', ev: '제세동', detail: 'VF 지속, 200J 2회째 시행, 압박 재개', by: '배응급' },
      { time: '14:14:00', ev: 'Amiodarone', detail: '300mg IV bolus', by: '박간호' },
      { time: '14:16:10', ev: 'ROSC', detail: '맥박 촉지(경동맥), BP 98/60, HR 92, 의식 회복', by: '배응급' },
    ],
    forms: { morse: [], braden: [] },
    handover: [
      { time: md(0, '14:50'), s: '14:10 VF 심정지, 제세동 2회 후 14:16 ROSC. 응급 PCI를 위해 심혈관조영실로 이송', b: '63세 남성, 하벽 STEMI, 고혈압·이상지질혈증, 흡연', a: 'BP 98~110/60s (norepinephrine 0.1), HR 90, SpO2 97% (O2 5L), 의식 명료. 항혈소판제·헤파린 투여 완료', r: '이송 중 모니터·제세동기 동반, 승압제 속도 유지, 부정맥 재발 시 즉시 제세동', author: '박간호' },
    ],
    memos: [
      { time: md(0, '14:55'), type: '진료메모', text: '보호자 도착 대기 중. 가족 면회를 요청함.', author: '구급이', shift: 'D', imp: '1' },
    ],
    consent: [
      consent('침습적 시술·검사 동의서', dt(0), '이순환', '법정대리인', '박영희', '배우자'),
      { name: '입원 동의서', date: dt(0), st: '작성', doctor: '이순환', note: '보호자 서명 예정' },
    ],
    imaging: [
      { time: md(0, '14:25'), name: 'Chest X-ray portable', result: 'Borderline cardiomegaly, no pulmonary edema, no pneumothorax', st: '판독완료' },
      { time: md(0, '14:08'), name: '12-lead ECG', result: 'Sinus tachycardia, ST elevation II, III, aVF; reciprocal ST depression V4-6', st: '판독완료' },
    ],
    consult: [
      { date: dt(0), dept: 'ER', doc: '배응급', req: 'Inferior STEMI, VF arrest ROSC. 응급 PCI 요청', rdept: 'CV', reply: '즉시 시술 예정, 중환자실 입실', st: '회신완료' },
    ],
    history: [
      { dept: 'CV', date: dt(-200), dx: 'Hypertension', code: 'I10', kind: '외래' },
    ],
  },
};

export const er2: Sample = {
  key: 'er2',
  subject: '응급',
  title: '응급 · 발목 염좌 (KTAS 4)',
  data: {
    info: {
      sampleKey: 'er2', ptNo: '0022', name: '한지유', ageSex: '21/F', ward: '응급실', dept: 'ER', doctor: '구급이', admit: dt(0), visitTime: '15:10', vstatus: '진료중', ktas: '4', zone: '비응급', orderDate: dt(0),
      allergy: '무', dx: 'Ankle sprain, rt (grade II)', height: '165', weight: '56.0', iso: '없음', npo: '0', surg: '0',
      cc: '오른쪽 발목 통증, 부종, 체중 부하 불편', onset: full(0, '14:40'),
      hpi: '농구 중 착지하다가 오른쪽 발목을 안쪽으로 접질림. 즉시 통증과 부종이 생겼고 절뚝거리며 걸을 수 있으나 체중을 실으면 아픔. 과거 같은 부위 염좌 1회(2년 전).',
      pmh: '특이사항 무', fh: '특이사항 무', social: '대학생', drink: '가끔', smoke: '무',
      pe: '혈압 116/72 (mmHg)  맥박 84 (/min)  호흡 16 (/min)  체온 36.5 (℃)  SpO2 99%\nRt ankle: 외측 부종과 멍, 전거비인대 압통(+), 외과·내과 후방·5번 중족골 기저부 압통 없음, 발 맥박·감각 정상',
      plan: '- Ankle X-ray (Ottawa ankle rules: 4걸음 보행 가능, 뼈 압통 없음이나 확인 목적)\n- RICE, 부목(또는 보조기), 목발\n- 통증 조절, 퇴원 교육, 1주 후 정형외과 외래',
      route: '자가 내원', method: '휠체어', informant: '환자', pain: 'NRS 5',
    },
    progress: [
      { time: full(0, '15:50'), dept: 'ER', text: 'S) 아까보다 덜 아픔(NRS 4). 발가락 감각 정상.\nO) X-ray: 골절 소견 없음. 외측 인대 압통, 부종 중등도. 발 맥박 촉지, 모세혈관 재충혈 2초.\nA) Rt ankle sprain, grade II\nP) 부목 적용 후 목발 보행 교육, 소염진통제, 정형외과 외래 1주 후.', author: '구급이' },
      { time: full(0, '15:20'), dept: 'ER', text: 'S) 농구하다 오른쪽 발목을 접질림, 체중 실을 때 아픔.\nO) 외측 부종·멍, 전거비인대 압통, 골 압통 없음.\nA) Ankle sprain, 골절 감별 필요\nP) Ankle X-ray (AP, Lat, Mortise), RICE.', author: '구급이' },
    ],
    orders: [
      sec('▶ 응급 처방 ◀'),
      od('Check V/S', '', '', '', '', '', [], '1'),
      od('Ankle X-ray (AP, Lat, Mortise) Rt', '', '', '', '', '집계완료', [], '1'),
      od('RICE (휴식, 냉찜질, 압박, 거상)', '', '', '', '', '', [], '1'),
      od('Posterior splint / ankle brace 적용', '', '', '', '', '집계완료', [], '1'),
      od('목발 보행 교육', '', '', '', '', '집계완료', [], '1'),
      sec('▶ 약물 ◀'),
      od('Ibuprofen 400mg (이부프로펜)', '1', 'T', '3회', 'PO', '집계완료', ['16:00/박'], '1'),
      memo('※ 식후 복용, 위장 불편 시 보고'),
      od('Acetaminophen 650mg (타이레놀)', '1', 'T', '', 'PO', '', [], '', 'PRN'),
      memo('※ NRS 5 이상 시. 최소투여간격 6시간.'),
      od('Tramadol 50mg (트라마돌)', '1', 'C', '', 'PO', '', [], '', 'D/C'),
      memo('※ 경한 통증으로 D/C'),
    ],
    mar: [
      mar(full(0, '16:00'), 'Ibuprofen 400mg (이부프로펜)', '1T', 'PO', '16:00', '박간호', { note: '식후 복용 여부 확인함' }),
    ],
    vitals: [
      vit(md(0, '15:10'), '116/72', '84', '16', '36.5', '99', '5'),
      vit(md(0, '15:55'), '112/70', '78', '16', '36.5', '99', '4'),
    ],
    io: [],
    labs: [],
    notes: [
      { time: md(0, '16:10'), focus: '급성 통증', text: 'S)\n"가만히 있으면 괜찮은데 걸을 때 많이 아파요."\n\nO)\n우측 발목 외측 부종·멍, NRS 5 → 냉찜질 20분 및 부목 적용 후 NRS 3. 발등 맥박 촉지, 발가락 감각·움직임 정상, 모세혈관 재충혈 2초.\n\nA)\n냉찜질과 거상, 부목 적용 후 통증 감소됨. 신경혈관 상태 정상.\n\nI)\n수건으로 감싼 냉찜질 20분 시행, 발을 심장보다 높게 거상, 부목 적용 후 신경혈관 사정, 처방 진통제 투여함.\n\nE)\n환자가 RICE 방법을 설명하고 목발 보행을 안전하게 시범함.', author: '박간호', shift: 'D' },
      { time: md(0, '16:30'), focus: '목발 보행', text: 'D)\n목발 높이가 맞지 않아 겨드랑이가 눌린다고 함. 목발 보행 경험 없음.\n\nA)\n목발 길이 조절(겨드랑이 아래 2~3 손가락 너비), 손잡이 위치 조정, 3점 보행 방법과 계단 오르내리기 시범 및 교육함.\n\nR)\n환자가 병실 복도를 목발로 20m 보행하며 3점 보행을 정확히 수행함.', author: '박간호', shift: 'D' },
    ],
    care: [
      { dx: '급성 통증', data: '우측 발목 NRS 5, 체중 부하 시 악화, 부종', goal: '퇴원 시 NRS 3 이하', plan: '통증 사정, 냉찜질·거상·압박·휴식, 진통제 투여, 부목 적용', eval: '달성. NRS 3.' },
      { dx: '말초신경혈관 기능장애 위험성', data: '발목 부종, 부목 적용', goal: '부목 적용 후 신경혈관 이상 없음', plan: '맥박·감각·움직임·온도 확인, 부종 심해지면 알리도록 교육', eval: '달성. 이상 없음.' },
      { dx: '지식부족', data: '목발 사용 경험 없음, RICE 방법과 부목 관리 모름', goal: '퇴원 전 목발 보행과 RICE를 시범', plan: '목발 보행 교육, 부목 관리와 위험 징후 교육', eval: '달성.' },
    ],
    lines: [],
    wounds: [
      { time: md(0, '15:30'), site: '우측 발목 외측', kind: '기타', size: '5×4', look: '부종 중등도, 멍 있음, 피부 손상 없음', dress: 'Posterior splint 적용', by: '박간호' },
    ],
    edu: [
      { time: md(0, '16:30'), topic: '목발 보행 (3점 보행, 계단)', target: '환자', method: '시범', under: '충분', by: '박간호' },
      { time: md(0, '16:20'), topic: 'RICE와 부목 관리, 발가락 저림·청색증 시 즉시 내원', target: '환자', method: '유인물', under: '충분', by: '박간호' },
    ],
    specimen: [],
    transport: [
      { time: md(0, '15:25'), from: '응급실', to: '영상의학과(X-ray)', mode: '휠체어', escort: '이송 직원', st: '복귀' },
    ],
    imaging: [
      { time: md(0, '15:35'), name: 'Ankle X-ray (AP, Lat, Mortise) Rt', result: 'No acute fracture or dislocation. Soft tissue swelling at lateral malleolus.', st: '판독완료' },
    ],
    consent: [
      consent('개인정보 수집·이용 동의서', dt(0), '구급이', '본인', '한지유'),
    ],
    appts: [
      { date: dt(7), time: '14:00', dept: 'OS', doc: '하정형', purpose: '발목 염좌 추적 (인대 손상 정도 평가)', st: '예약' },
    ],
    memos: [
      { time: md(0, '16:00'), type: '진료메모', text: '보호자 동행이 어려운 상황. 회사 제출용 진단서 발급 요청함.', author: '구급이', shift: 'D' },
    ],
    history: [
      { dept: 'ER', date: dt(-730), dx: 'Ankle sprain, rt', code: 'S93.4', kind: '응급' },
    ],
  },
};
