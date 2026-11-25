import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, morse, braden, painForm, preop, ALL13, consent, mar } from './h';

export const gs: Sample = {
  key: 'gs',
  subject: '외과',
  title: '일반외과 · 복강경 충수절제술 후 1일',
  data: {
    info: {
      sampleKey: 'gs', bed: '801-1', ptNo: '0007', name: '이준호', ageSex: '29/M', ward: '81병동', dept: 'GS', doctor: '장일반', admit: dt(-1), orderDate: dt(0),
      allergy: '무', dx: 'Acute appendicitis, s/p laparoscopic appendectomy', height: '175', weight: '72.0', iso: '없음', npo: '0', surg: '1',
      cc: '우하복부 통증, 발열', onset: dt(-2),
      hpi: '2일 전 명치 부위 통증으로 시작해 우하복부로 이동하였고 구역과 미열이 동반됨. 응급실에서 복부 CT상 급성 충수염 소견으로 수술 후 입원함.',
      pmh: '특이사항 없음', fh: '특이사항 없음', social: '직장인, 가족과 거주', drink: '주 1회', smoke: '무',
      pe: '입원 시: 혈압 124/76 (mmHg)  맥박 96 (/min)  호흡 18 (/min)  체온 37.9 (℃)\nAbdomen: RLQ tenderness (+), rebound tenderness (+)',
      plan: '- 복강경 충수절제술 후 금식 → 수술 다음 날 물부터 식사 진행\n- 항생제, 진통제, 조기 보행\n- 수술 부위 소독 및 관찰, 장음 회복 확인',
      route: '응급실', method: '휠체어', informant: '환자', job: '회사원', religion: '무교', marital: '미혼', lang: '한국어', purpose: 'operation', insight: '유',
      bedsore: '20', fall: '20', pain: 'NRS 4 (수술 부위)',
      disDate: dt(2), disMethod: '보행', disPlace: '자택', disGuardian: '어머니', disTarget: '환자, 어머니', dcEdu: '',
    },
    progress: [
      { time: full(0, '08:50'), dept: 'GS', text: 'S) 수술 부위 통증 있으나 견딜 만함. 가스 배출함. 물 마셔도 구역 없음.\nO) BT 37.2, BP 118/72, HR 78. Abdomen soft, mild tender at port site, bowel sound 정상. 상처 dressing clean & dry.\nA) POD#1, 경과 양호\nP) 식사 시작(연식), PCA 중단하고 경구 진통제 전환, 조기 보행, 내일 퇴원 고려.', author: '장일반' },
      { time: full(-1, '19:30'), dept: 'GS', text: '수술 후 회복실 경과 양호. 활력징후 안정, 금식 유지, 진통제 처방 확인.', author: '백외과' },
    ],
    orders: [
      sec('▶ 기본처방 ◀'),
      od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'),
      od('Check I/O q [8] hrs', '', '', '', '', '', [], '1'),
      od('Op site dressing check', '', '', '', '', '', [], '1'),
      od('Early ambulation (post-op 6hr~)', '', '', '', '', '', [], '1'),
      od('Incentive spirometry q [2] hrs', '', '', '', '', '', [], '1'),
      sec('▶ 식사 처방 ◀'),
      od('NPO', '', '', '', '', '집계완료', [], '', 'D/C'),
      od('Soft diet', '', '', '', '', '집계완료'),
      sec('▶ 주사약 ◀'),
      od('Cefazolin 1g/V (세파졸린)', '1', 'g', '3회', 'IV', '집계완료', ['06:00/최', '14:00/박', '22:00/'], '1'),
      od('0.9% Sod. Chloride 100ml/B (대한약품)', '100', 'ml', '3회', 'IV', '집계완료', ['06:00/최', '14:00/박', '22:00/'], '1'),
      od('Ketorolac 30mg/mL (케토롤)', '30', 'mg', '3회', 'IV', '집계완료', ['06:00/최', '14:00/박', '22:00/'], '1'),
      od('Ondansetron 4mg/2mL (온단세트론)', '4', 'mg', '1회', 'IV', '', [], '', 'PRN'),
      memo('※ 구역·구토 시. 최소투여간격 8시간.'),
      od('Tramadol 50mg/mL (트라마돌)', '50', 'mg', '1회', 'IV', '', [], '', 'PRN'),
      memo('※ NRS 5 이상 시, 최소투여간격 6시간.'),
      sec('▶ 먹는약 ◀'),
      od('Acetaminophen 650mg (타이레놀)', '1', 'T', '3회', 'PO', '집계완료', ['13:00/박', '19:00/', '24:00/'], '1'),
      sec('▶ 검 사 ◀'),
      od('CBC, CRP', '', '', '', '', '접수'),
    ],
    mar: [
      mar(full(0, '06:05'), 'Cefazolin 1g/V (세파졸린)', '1g', 'IV', '06:00', '최간호'),
      mar(full(0, '06:10'), 'Ketorolac 30mg/mL (케토롤)', '30mg', 'IV', '06:00', '최간호', { note: '통증 NRS 5, 수술 부위' }),
      mar(full(-1, '23:30'), 'Ondansetron 4mg/2mL (온단세트론)', '4mg', 'IV', 'PRN', '최간호', { note: '구역 호소 후 투여, 30분 후 소실' }),
    ],
    vitals: [
      vit(md(-1, '18:30'), '126/78', '92', '18', '37.6', '98', '6'),
      vit(md(-1, '20:30'), '122/74', '88', '18', '37.4', '98', '5'),
      vit(md(-1, '23:30'), '118/72', '84', '18', '37.3', '98', '5'),
      vit(md(0, '04:00'), '116/70', '80', '18', '37.1', '98', '4'),
      vit(md(0, '08:00'), '118/72', '78', '16', '37.2', '99', '4'),
    ],
    io: [
      { time: `${dt(-1)} E`, intake: 'IV 700', output: '소변 400', note: '수술 직후 Foley 없이 자가 배뇨 확인' },
      { time: `${dt(-1)} N`, intake: 'IV 500', output: '소변 550', note: '' },
      { time: `${dt(0)} D`, intake: 'PO 200 / IV 300', output: '소변 400', note: '' },
    ],
    labs: [
      { name: 'WBC', value: '15.6', unit: '10^3/uL', min: '4.0', max: '10.0', sample: 'Blood', time: md(-1, '09:30') },
      { name: 'WBC', value: '11.8', unit: '10^3/uL', min: '4.0', max: '10.0', sample: 'Blood', time: md(0, '05:30') },
      { name: 'CRP', value: '6.2', unit: 'mg/dL', min: '0', max: '0.5', sample: 'Blood', time: md(-1, '09:30') },
      { name: 'CRP', value: '4.1', unit: 'mg/dL', min: '0', max: '0.5', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Hb', value: '14.2', unit: 'g/dL', min: '13', max: '17', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Na', value: '139', unit: 'mmol/L', min: '135', max: '145', sample: 'Blood', time: md(0, '05:30') },
    ],
    notes: [
      { time: md(0, '10:00'), focus: '급성 통증', text: 'S)\n"배에 구멍 뚫은 곳이 움직일 때 아파요. 가만히 있으면 괜찮아요."\n\nO)\nNRS 4 (움직일 때), 안정 시 2. BP 118/72, HR 78. 배꼽 및 좌하복부 port 부위 dressing clean & dry.\n\nA)\n수술 후 1일, 통증 조절 양호함.\n\nI)\n처방에 따라 acetaminophen 투여, 기침·체위 변경 시 베개로 복부 지지하는 방법 교육함.\n\nE)\n투약 1시간 후 NRS 2로 감소, 보행 시 복부 지지 방법을 시범 보임.', author: '박간호', shift: 'D' },
      { time: md(0, '07:40'), focus: '조기 이상', text: 'D)\n수술 후 첫 보행 시도. 침상 끝에서 5분 앉았다가 일어났을 때 어지럼 없음, BP 120/74.\n\nA)\n간호사가 보조하여 병실 복도 20m 보행함. IV 폴대 정리해 줌.\n\nR)\n보행 후 통증 NRS 4, 활력징후 안정, 가스 배출 확인함.', author: '최간호', shift: 'N' },
      { time: md(-1, '19:30'), focus: '수술 후 회복', text: 'S)\n"입이 마르고 배가 아파요."\n\nO)\n회복실에서 병동으로 이동. 의식 명료, BP 126/78, HR 92, SpO2 98%. 복강경 port 3곳 dressing 청결, 출혈 없음. Foley 없음.\n\nA)\n전신마취 후 회복 양호, 금식 유지.\n\nI)\n침상 난간 올리고 호출벨 위치 안내, 입술 적셔줌, 처방 진통제 투여함.\n\nE)\n환자가 통증 시 호출하겠다고 말함.', author: '김간호', shift: 'E' },
    ],
    care: [
      { dx: '급성 통증', data: '수술 부위 NRS 4~6, 움직일 때 악화, 표정 찡그림', goal: 'NRS 3 이하 유지, 보행 가능', plan: '통증 사정, 처방 진통제 투여, 복부 지지 교육, 조기 보행 격려, 비약물 요법', eval: '달성. NRS 2~4, 복도 보행 가능.' },
      { dx: '감염 위험성', data: '복강경 port 3곳, 상처 청결, WBC 11.8', goal: '퇴원 시까지 상처 감염 징후 없음', plan: '무균술로 dressing 관찰, 항생제 투여, 발적·삼출물 사정, 손 위생 교육', eval: '진행 중. 감염 징후 없음.' },
      { dx: '지식부족', data: '수술 후 상처 관리·식이 진행·활동 제한을 모름', goal: '퇴원 전 상처 관리와 주의 증상을 설명할 수 있음', plan: '퇴원 교육, 샤워 시기와 중증 증상(발열, 복통 악화, 상처 삼출물) 설명', eval: '' },
    ],
    lines: [
      { kind: 'IV catheter', site: 'Rt. 손등 20G', ins: dt(-1), chg: dt(2), out: '', st: '유지', note: '수술 전 삽입' },
    ],
    iv: [
      { time: '06:00', fluid: 'D5 0.45% N/S 1L', rate: '100', remain: '500', site: 'Rt. 손등 20G', st: '주입 중', by: '최간호' },
    ],
    wounds: [
      { time: md(0, '09:00'), site: '배꼽 (12mm port)', kind: '수술 상처', size: '1.5', look: '삼출물·발적·부종 없음, 가장자리 접근 양호', dress: '방수 필름 드레싱', by: '박간호' },
      { time: md(0, '09:00'), site: '좌하복부 (5mm port) x2', kind: '수술 상처', size: '0.7', look: '삼출물 없음, 소량 멍', dress: '방수 필름 드레싱', by: '박간호' },
    ],
    edu: [
      { time: md(0, '11:00'), topic: '수술 후 복부 지지하며 기침하기와 조기 보행', target: '환자', method: '시범', under: '충분', by: '박간호' },
      { time: md(-1, '21:00'), topic: '금식 이유와 구강 관리, 호출벨 사용', target: '환자', method: '구두', under: '충분', by: '김간호' },
    ],
    specimen: [
      { time: md(-1, '09:30'), test: 'CBC, CRP, BMP, UA', tube: 'EDTA', st: '결과', by: '응급실' },
      { time: md(0, '05:30'), test: 'CBC, CRP', tube: 'EDTA', st: '결과', by: '최간호' },
    ],
    transport: [
      { time: md(-1, '14:30'), from: '81병동', to: '수술실', mode: '침대', escort: '수술실 간호사', st: '복귀' },
      { time: md(-1, '18:00'), from: '회복실', to: '81병동', mode: '침대', escort: '회복실 간호사', st: '도착' },
    ],
    moves: [
      { time: md(-1, '12:00'), type: '전동', from: '응급실', to: '81병동 804호', reason: '급성 충수염 수술 입원' },
    ],
    anes: [
      { time: md(-1, '15:30'), ev: '마취 전 평가', detail: 'ASA class I, NPO 8시간 이상 확인, 기도 평가 Mallampati II', by: '마취통증의학과' },
      { time: md(-1, '15:50'), ev: '마취 시작', detail: '전신마취 유도: Propofol 120mg, Rocuronium 50mg, Fentanyl 100mcg. 기관 삽관(7.5mm).', by: '마취통증의학과' },
      { time: md(-1, '16:05'), ev: '수술 시작', detail: '', by: '마취통증의학과' },
      { time: md(-1, '16:50'), ev: '수술 종료', detail: 'Sevoflurane 중단, Sugammadex 200mg 투여', by: '마취통증의학과' },
      { time: md(-1, '17:00'), ev: '발관', detail: '자발 호흡 회복, 발관 후 SpO2 98% (face mask 5L)', by: '마취통증의학과' },
      { time: md(-1, '17:10'), ev: '회복실 입실', detail: 'Aldrete score 9점. 구역 호소 → ondansetron 투여', by: '회복실 간호사' },
    ],
    surgery: [
      { date: dt(-1), dept: 'GS', name: 'Laparoscopic appendectomy', anes: '전신마취', note: '화농성 충수염, 천공 없음, 배액관 삽입 안 함. 출혈 최소.' },
    ],
    forms: {
      morse: [morse(md(0, '08:30'), [0, 0, 0, 1, 0, 0])],
      braden: [braden(md(0, '08:30'), [3, 2, 2, 3, 2, 2])],
      pain: [
        painForm(md(0, '09:30'), '4', '배꼽 및 좌하복부 port 부위', '쑤심', '움직일 때', '기침, 일어날 때', '안정, 복부 지지', 'Acetaminophen 투여, 복부 지지 교육', '2'),
        painForm(md(-1, '19:30'), '6', '복부 전체', '욱신거림', '지속적', '움직일 때', '안정', 'Ketorolac IV 투여', '4'),
      ],
      preop: [preop(md(-1, '14:00'), ALL13.filter(n => n !== 12), '혈액 준비는 필요 없음으로 확인')],
    },
    handover: [
      { time: md(0, '07:00'), s: '수술 후 1일, 밤새 안정적. 새벽 가스 배출 확인함', b: '급성 충수염으로 복강경 충수절제술(전신마취) 시행', a: 'BT 37.1, NRS 4, 상처 dressing 청결, 소변 자가 배뇨 양호', r: '식사 시작 후 구역·구토 관찰, 보행 격려, 오전 회진에서 PCA/진통제 확인', author: '최간호' },
    ],
    memos: [
      { time: md(0, '09:00'), type: '진료메모', text: '직장 복귀 일정 때문에 진단서 요청함. 비급여 진통제는 원치 않음.', author: '김간호', shift: 'D' },
      { time: md(-1, '21:30'), type: '간호메모', text: '23:30 구역 호소 → ondansetron 4mg IV 투여, 이후 소실. 금식 유지.', author: '김간호', shift: 'E' },
    ],
    consent: [
      consent('입원 동의서', dt(-1), '장일반', '본인', '이준호'),
      consent('수술 동의서', dt(-1), '장일반', '본인', '이준호'),
      consent('마취 동의서', dt(-1), '장일반', '본인', '이준호'),
    ],
    imaging: [
      { time: md(-1, '10:30'), name: 'Abdomen CT (조영 증강)', result: 'Acute appendicitis with periappendiceal fat stranding. No perforation or abscess.', st: '판독완료' },
    ],
    nutrition: [
      { time: full(0, '09:30'), text: '수술 후 영양 평가: 금식 해제, 물 → 맑은 유동식 → 연식 단계적 진행. 구역 없고 장음 정상. 퇴원 후 자극적·기름진 음식은 피하도록 안내 예정.', author: '영양사' },
    ],
    appts: [
      { date: dt(9), time: '09:30', dept: 'GS', doc: '장일반', purpose: '퇴원 후 1주 외래 (상처 확인, 병리 결과 설명)', st: '예약' },
    ],
    history: [
      { dept: 'GS', date: dt(-1), dx: 'Acute appendicitis', code: 'K35.8', kind: '응급' },
    ],
  },
};
