import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, morse, braden, painForm, preop, ALL13, consent, mar } from './h';

export const os: Sample = {
  key: 'os',
  subject: '외과',
  title: '정형외과 · 슬관절 전치환술 후 1일',
  data: {
    info: {
      sampleKey: 'os', bed: '901-1', ptNo: '0008', name: '박정애', ageSex: '69/F', ward: '91병동', dept: 'OS', doctor: '하정형', admit: dt(-2), orderDate: dt(0),
      allergy: '아스피린/NSAIDs', dx: 'Primary osteoarthritis of right knee, s/p TKA (Rt)', height: '152', weight: '66.0', iso: '없음', npo: '0', surg: '1',
      cc: 'Rt. 무릎 통증, 보행 장애', onset: dt(-1100),
      hpi: '3년 전부터 Rt. 무릎 통증이 심해져 계단 이용과 보행이 어렵고 보존 치료에 반응이 없어 Rt. 슬관절 전치환술을 위해 입원함.',
      pmh: '고혈압(유), 골다공증(유), 당뇨(무)', fh: '특이사항 없음', social: '남편과 거주, 아파트 5층(엘리베이터 있음)', drink: '무', smoke: '무',
      pe: '혈압 132/80 (mmHg)  맥박 78 (/min)  호흡 18 (/min)  체온 36.6 (℃)\nRt knee: varus deformity, ROM 5-100, crepitus(+)',
      plan: '- Rt. TKA 후 배액관(Hemovac) 관리, 하지 거상, 냉찜질\n- 수술 후 1일부터 CPM 및 보행기 보행\n- DVT 예방(LMWH, 탄력 스타킹), 빈혈 모니터링',
      route: '외래', method: '휠체어', informant: '환자', job: '주부', religion: '천주교', marital: '기혼', lang: '한국어', purpose: 'operation', insight: '유',
      bedsore: '17', fall: '60', pain: 'NRS 5 (Rt. 무릎)',
      disDate: dt(6), disMethod: '휠체어', disPlace: '자택', disGuardian: '남편', disTarget: '환자, 남편', dcEdu: '',
    },
    progress: [
      { time: full(0, '08:40'), dept: 'OS', text: 'S) 무릎이 많이 욱신거림. 밤에 잠을 못 잠.\nO) BT 37.4, BP 118/70, HR 82. Hemovac 출력 220mL/24h. 상처 dressing 소량 혈성 삼출. Hb 8.6 (술 전 11.8).\nA) POD#1, 수술 후 급성 실혈성 빈혈\nP) pRBC 1 unit 수혈, 배액관 유지, CPM 시작, 보행기 보행 훈련.', author: '하정형' },
      { time: full(-1, '17:30'), dept: 'OS', text: 'Rt. TKA 시행. 수술 중 특이사항 없음. 수술 후 신경·혈관 상태 정상(발등 맥박 촉지, 발가락 움직임 가능).', author: '도관절' },
    ],
    orders: [
      sec('▶ 기본처방 ◀'),
      od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'),
      od('Check I/O q [8] hrs', '', '', '', '', '', [], '1'),
      od('Check neurovascular status (Rt leg) q [4] hrs', '', '', '', '', '', [], '1'),
      od('Check Hemovac amount & color q [8] hrs', '', '', '', '', '', [], '1'),
      od('Rt. 하지 거상, 냉찜질 20분씩', '', '', '', '', '', [], '1'),
      od('CPM 0~60° start (from today)', '', '', '', '', '집계완료'),
      od('Walker ambulation (under PT supervision)', '', '', '', '', '집계완료'),
      od('Elastic stocking (T.E.D) apply', '', '', '', '', '', [], '1'),
      sec('▶ 주사약 ◀'),
      od('Cefazolin 1g/V (세파졸린)', '1', 'g', '3회', 'IV', '집계완료', ['06:00/최', '14:00/', '22:00/']),
      od('Enoxaparin 40mg/0.4mL (크렉산)', '40', 'mg', '1회', 'SC', '집계완료', ['20:00/'], '', ''),
      memo('※ 고위험 약물: 투여 전 이중확인'),
      od('Ketorolac 30mg/mL (케토롤)', '30', 'mg', '3회', 'IV', '', [], '', 'D/C'),
      memo('※ NSAIDs 알레르기로 D/C'),
      od('Tramadol 50mg/mL (트라마돌)', '50', 'mg', '1회', 'IV', '', [], '', 'PRN'),
      memo('※ NRS 5 이상 시. 최소투여간격 6시간.'),
      od('Morphine 4mg/mL', '4', 'mg', '1회', 'IV', '', [], '', 'PRN'),
      memo('※ NRS 8 이상, 마약류 이중확인 필수'),
      sec('▶ 먹는약 ◀'),
      od('Acetaminophen 650mg (타이레놀)', '1', 'T', '3회', 'PO', '집계완료', ['09:00/박', '15:00/', '21:00/'], '1'),
      od('Celecoxib 200mg (쎄레브렉스)', '1', 'C', '', 'PO', '', [], '', 'D/C'),
      od('Pantoprazole 40mg (판토록)', '1', 'T', '1회', 'PO', '집계완료', ['09:00/박'], '1'),
      sec('▶ 수혈 ◀'),
      od('pRBC 1 unit (LR, filtered)', '1', 'unit', '1회', 'IV', '집계완료', ['10:30/박'], '1', 'STAT'),
      sec('▶ 검 사 ◀'),
      od('CBC, BMP', '', '', '', '', '접수'),
      od('Knee X-ray (AP, Lat) post-op', '', '', '', '', '집계완료', [], '1'),
    ],
    mar: [
      mar(full(0, '09:05'), 'Acetaminophen 650mg (타이레놀)', '1T', 'PO', '09:00', '박간호'),
      mar(full(0, '09:10'), 'Pantoprazole 40mg (판토록)', '1T', 'PO', '09:00', '박간호'),
      mar(full(-1, '20:10'), 'Enoxaparin 40mg/0.4mL (크렉산)', '40mg', 'SC', '20:00', '김간호', { dbl: '최간호' }),
      mar(full(0, '02:10'), 'Tramadol 50mg/mL (트라마돌)', '50mg', 'IV', 'PRN', '최간호', { note: '통증 NRS 7, 투여 1시간 후 NRS 4' }),
    ],
    vitals: [
      vit(md(-1, '17:30'), '120/72', '84', '18', '36.9', '98', '6'),
      vit(md(-1, '20:00'), '116/70', '82', '18', '37.1', '98', '6'),
      vit(md(-1, '23:00'), '112/68', '86', '18', '37.3', '97', '7'),
      vit(md(0, '02:00'), '110/66', '90', '20', '37.5', '97', '7'),
      vit(md(0, '04:00'), '112/68', '88', '18', '37.4', '98', '4'),
      vit(md(0, '08:00'), '118/70', '82', '18', '37.4', '98', '5'),
      vit(md(0, '10:45'), '116/70', '84', '18', '37.5', '98', '5'),
    ],
    io: [
      { time: `${dt(-1)} E`, intake: 'IV 800', output: '소변 350 / Hemovac 80', note: '수술 후 Foley 유지' },
      { time: `${dt(-1)} N`, intake: 'IV 600 / PO 100', output: '소변 700 / Hemovac 90', note: '' },
      { time: `${dt(0)} D`, intake: 'IV 350 (pRBC 포함) / PO 300', output: '소변 600 / Hemovac 50', note: 'Foley 제거 예정' },
    ],
    labs: [
      { name: 'Hb', value: '11.8', unit: 'g/dL', min: '12', max: '16', sample: 'Blood', time: md(-2, '09:00') },
      { name: 'Hb', value: '8.6', unit: 'g/dL', min: '12', max: '16', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Hct', value: '26.1', unit: '%', min: '36', max: '46', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Plt', value: '182', unit: '10^3/uL', min: '150', max: '400', sample: 'Blood', time: md(0, '05:30') },
      { name: 'WBC', value: '10.9', unit: '10^3/uL', min: '4.0', max: '10.0', sample: 'Blood', time: md(0, '05:30') },
      { name: 'K', value: '3.7', unit: 'mmol/L', min: '3.5', max: '5.0', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Creatinine', value: '0.8', unit: 'mg/dL', min: '0.5', max: '1.1', sample: 'Blood', time: md(0, '05:30') },
    ],
    notes: [
      { time: md(0, '11:00'), focus: '수혈', text: 'S)\n"수혈하고 나서 어지럽거나 가렵지는 않아요."\n\nO)\n수혈 전 BP 118/70, HR 82, BT 37.4. pRBC 1 unit 10:30 시작, 15분 후 BP 116/70, HR 84, BT 37.5, 발진·호흡곤란 없음.\n\nA)\n수혈 반응 없음. 속도 시작 후 15분간 천천히 주입함.\n\nI)\n2인 확인(환자명, 환자번호, 혈액형, 혈액번호) 후 수혈 시작, 수혈 중 활력징후 측정함.\n\nE)\n수혈 반응 증상(오한, 가려움, 호흡곤란) 있으면 즉시 알리도록 설명함.', author: '박간호', shift: 'D' },
      { time: md(0, '02:15'), focus: '급성 통증', text: 'D)\n수술 부위 통증 NRS 7 호소, 얼굴 찡그리고 식은땀. BP 110/66, HR 90.\n\nA)\nPRN tramadol 50mg IV 투여함. Rt. 하지 거상, 냉찜질 적용함.\n\nR)\n03:15 NRS 4로 감소, 잠듦.', author: '최간호', shift: 'N' },
      { time: md(-1, '20:30'), focus: '신경혈관 사정', text: 'D)\nRt. 하지: 발등 맥박 촉지됨(+), 모세혈관 재충혈 2초, 발가락 움직임·감각 정상, 발가락 온도 따뜻함. Hemovac 80mL 혈성.\n\nA)\n하지 거상 유지, 배액관 꺾임 없는지 확인, Elastic stocking (T.E.D) apply 확인함.\n\nR)\n신경혈관 이상 소견 없음.', author: '김간호', shift: 'E' },
    ],
    care: [
      { dx: '급성 통증', data: '무릎 수술 부위 NRS 5~7, 움직일 때 악화, 수면 방해', goal: '48시간 내 NRS 4 이하 유지', plan: '통증 사정, PRN 진통제 및 다각적 진통, 냉찜질, 하지 거상, CPM·PT 전 진통 시기 조정', eval: '진행 중. NRS 4~5.' },
      { dx: '낙상 위험성', data: 'Morse 60점, 보행기 사용, 마약성·진통제 투여, 수술 후 첫 보행', goal: '입원 기간 중 낙상 없음', plan: '침상 난간, 보행 시 간호사 동행, 호출벨, 미끄럼 방지 양말, 낙상 예방 교육', eval: '진행 중. 낙상 없음.' },
      { dx: '말초신경혈관 기능장애 위험성', data: 'Rt. TKA 후 부종, 배액관 삽입, 탄력 스타킹', goal: '수술 후 48시간 동안 신경혈관 이상 없음', plan: 'q4h 신경혈관 사정, 하지 거상, 배액관 양·양상 관찰, 구획증후군 증상 교육', eval: '진행 중. 정상.' },
      { dx: '감염 위험성', data: '상처 dressing 소량 삼출, Hemovac 삽입', goal: '퇴원 시 상처 감염 징후 없음', plan: '무균술 소독, 항생제 투여, 배액관 삽입 부위 관찰, 손 위생', eval: '진행 중.' },
    ],
    lines: [
      { kind: 'Hemovac', site: 'Rt. 슬관절 외측', ins: dt(-1), chg: '', out: '혈성 220mL/24h', st: '유지', note: '48시간 후 제거 예정' },
      { kind: 'Foley catheter', site: '16Fr', ins: dt(-1), chg: dt(0), out: '황색 투명', st: '유지', note: '오늘 제거 예정' },
      { kind: 'IV catheter', site: 'Lt. 전완 20G', ins: dt(-1), chg: dt(2), out: '', st: '유지', note: '수혈 중 사용' },
    ],
    iv: [
      { time: '10:30', fluid: 'pRBC 1 unit', rate: '60', remain: '280', site: 'Lt. 전완 20G', st: '주입 중', by: '박간호' },
      { time: '06:00', fluid: 'D5 0.45% N/S 1L', rate: '80', remain: '300', site: 'Lt. 전완 20G', st: '중단', by: '최간호' },
    ],
    wounds: [
      { time: md(0, '09:30'), site: 'Rt. 슬관절 전면 절개 (약 18cm)', kind: '수술 상처', size: '18', look: '소량 혈성 삼출(거즈 2×3cm), 주변 발적·열감 없음, 부종 약간', dress: '압박 드레싱', by: '박간호' },
      { time: md(0, '09:30'), site: '배액관 삽입부', kind: '삽입부위', size: '', look: '삼출 없음, 고정 양호', dress: '거즈 드레싱', by: '박간호' },
    ],
    edu: [
      { time: md(0, '13:00'), topic: '수혈 중 이상 반응 증상과 호출 방법', target: '환자', method: '구두', under: '충분', by: '박간호' },
      { time: md(0, '14:00'), topic: 'CPM 사용 방법과 무릎 운동', target: '환자', method: '시범', under: '보통', by: '물리치료사' },
      { time: md(-1, '21:00'), topic: '호흡 운동, 족관절 펌프 운동 (혈전 예방)', target: '환자·보호자', method: '시범', under: '충분', by: '김간호' },
    ],
    specimen: [
      { time: md(0, '05:30'), test: 'CBC, BMP, Type & screen', tube: 'EDTA', st: '결과', by: '최간호' },
    ],
    transport: [
      { time: md(-1, '12:30'), from: '91병동', to: '수술실', mode: '침대', escort: '수술실 간호사', st: '복귀' },
      { time: md(0, '15:00'), from: '91병동', to: '재활치료실', mode: '휠체어', escort: '이송 직원', st: '의뢰' },
    ],
    moves: [],
    transfusion: [
      { time: md(0, '10:20'), step: '확인', blood: 'pRBC (O+)', bno: '2026-114205', bp: '118/70', pr: '82', rr: '18', bt: '37.4', note: '2인 확인 완료: 박간호, 최간호' },
      { time: md(0, '10:30'), step: '시작', blood: 'pRBC (O+)', bno: '2026-114205', bp: '118/70', pr: '82', rr: '18', bt: '37.4', note: '처음 15분 천천히 주입' },
      { time: md(0, '10:45'), step: '수혈중', blood: 'pRBC (O+)', bno: '2026-114205', bp: '116/70', pr: '84', rr: '18', bt: '37.5', note: '이상 반응 없음' },
    ],
    anes: [
      { time: md(-1, '13:00'), ev: '마취 전 평가', detail: 'ASA class II (고혈압), NPO 확인', by: '마취통증의학과' },
      { time: md(-1, '13:20'), ev: '마취 시작', detail: '척추마취(L3-4), bupivacaine 12mg + Fentanyl 15mcg, 진정 Midazolam 1mg', by: '마취통증의학과' },
      { time: md(-1, '15:40'), ev: '수술 종료', detail: '출혈 약 300mL, 수액 1,000mL', by: '마취통증의학과' },
      { time: md(-1, '16:30'), ev: '회복실 입실', detail: 'Bromage score 1 → 3, 하지 감각 회복 진행', by: '회복실 간호사' },
    ],
    surgery: [
      { date: dt(-1), dept: 'OS', name: 'Total knee arthroplasty (Rt)', anes: '척추마취', note: '지혈대 80분, Hemovac 1개 삽입, 수술 후 신경혈관 정상' },
    ],
    forms: {
      morse: [morse(md(0, '08:00'), [0, 1, 1, 1, 1, 0])],
      braden: [braden(md(0, '08:00'), [3, 2, 1, 2, 2, 1])],
      pain: [
        painForm(md(0, '09:30'), '5', 'Rt. 무릎 수술 부위', '욱신거림', '지속적', '움직일 때, 보행 훈련', '냉찜질, 하지 거상', 'Acetaminophen 투여, 냉찜질 적용', '3'),
        painForm(md(0, '02:15'), '7', 'Rt. 무릎', '쑤심', '지속적', '자세 변경', '', 'Tramadol IV 투여, 하지 거상', '4'),
      ],
      preop: [preop(md(-1, '11:30'), ALL13, '혈액 2 unit 준비 확인')],
    },
    handover: [
      { time: md(0, '07:00'), s: '새벽 통증 NRS 7로 tramadol IV 투여 후 안정. Hb 8.6으로 수혈 예정', b: 'Rt. TKA 후 1일, NSAIDs 알레르기, 낙상 고위험', a: 'Hemovac 혈성 220mL/24h, 신경혈관 정상, BP 118/70', r: '10시 pRBC 1 unit 수혈, 수혈 중 활력징후 관찰, Foley 제거 후 자가 배뇨 확인', author: '최간호' },
    ],
    memos: [
      { time: md(0, '09:00'), type: '진료메모', text: '수혈에 대한 불안 호소. 보험사 제출용 진단서 2부 요청함.', author: '박간호', shift: 'D', imp: '1' },
      { time: md(0, '07:00'), type: '인수인계', text: '낙상 고위험(Morse 60). 보행은 반드시 간호사 또는 PT와 함께. 야간 PRN 투여 1회.', author: '최간호', shift: 'N', imp: '1' },
    ],
    consent: [
      consent('입원 동의서', dt(-2), '하정형', '본인', '박정애'),
      consent('수술 동의서', dt(-2), '하정형', '본인', '박정애'),
      consent('마취 동의서', dt(-2), '하정형', '본인', '박정애'),
      consent('수혈 동의서', dt(-2), '하정형', '본인', '박정애'),
    ],
    imaging: [
      { time: md(0, '07:30'), name: 'Rt knee X-ray (AP, Lat) 수술 후', result: 'Status post TKA, prosthesis in good alignment. No periprosthetic fracture.', st: '판독완료' },
    ],
    consult: [
      { date: dt(0), dept: 'OS', doc: '하정형', req: '수술 후 재활 치료 (CPM, 보행 훈련) 의뢰', rdept: 'RM', reply: '', st: '미회신' },
    ],
    nutrition: [
      { time: full(0, '09:20'), text: '수술 후 영양: 일반식 진행 중, 식사량 2/3. 철분 보충과 고단백 식이 권고.', author: '영양사' },
    ],
    appts: [
      { date: dt(14), time: '10:30', dept: 'OS', doc: '하정형', purpose: '퇴원 후 2주 외래 (상처 확인, 실밥 제거)', st: '예약' },
    ],
    history: [
      { dept: 'OS', date: dt(-60), dx: 'Primary osteoarthritis of knee', code: 'M17.1', kind: '외래' },
    ],
  },
};
