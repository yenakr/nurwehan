import type { Sample } from '../types';
import { dt, md, full, sec, memo, od, vit, morse, braden, painForm, preop, ALL13, consent, mar } from './h';

export const women: Sample = {
  key: 'women',
  subject: '여성',
  title: '모성 · 제왕절개 산후 1일',
  data: {
    info: {
      sampleKey: 'women', bed: '401-1', ptNo: '00000003', name: '정미경', ageSex: '33/F', ward: '41병동', dept: 'OB', doctor: '최산부', admit: dt(-2), orderDate: dt(0),
      allergy: '무', dx: 'Term pregnancy, s/p repeat low transverse cesarean section (G2P2)', height: '162', weight: '71.0', iso: '없음', npo: '0', surg: '1',
      cc: '예정 제왕절개 분만', onset: dt(-2),
      hpi: '임신 39주 2일, 첫째 아이를 제왕절개로 분만한 과거력이 있어 예정 제왕절개를 위해 입원함. 산전 검사에서 특이 소견 없음.',
      pmh: '제왕절개 1회(2022), 임신성 당뇨(무), 임신성 고혈압(무)', fh: '특이사항 없음', social: '남편, 4세 딸과 거주', drink: '무', smoke: '무',
      pe: '입원 시: 혈압 118/72 (mmHg)  맥박 82 (/min)  호흡 18 (/min)  체온 36.6 (℃)\nFundal height 37cm, FHR 142/min, 자궁수축 없음',
      plan: '- 수술 후 자궁저부 마사지 및 출혈 관찰, 조기 보행\n- 통증 조절, 모유수유 지원, 신생아 모자동실\n- 수술 후 2~3일 퇴원 교육',
      route: '외래', method: '보행', informant: '환자', job: '회사원 (육아휴직)', religion: '무교', marital: '기혼', lang: '한국어', purpose: 'delivery', insight: '유',
      bedsore: '20', fall: '30', pain: 'NRS 5 (수술 부위)',
      disDate: dt(2), disMethod: '보행', disPlace: '자택', disGuardian: '남편', disTarget: '산모, 남편', dcEdu: '',
    },
    progress: [
      { time: full(0, '08:30'), dept: 'OB', text: 'S) 상처가 아프고 일어날 때 힘듦. 가스는 아직 안 나옴. 젖은 조금씩 돌기 시작함.\nO) BP 112/70, HR 84, BT 37.3. 자궁저부 배꼽 아래 1FB, firm. 오로 rubra 소량. Hb 10.2 (술 전 12.1). 상처 dressing clean.\nA) POD#1, 경과 양호\nP) Foley 제거, 식사 시작(연식), 보행 격려, 모유수유 교육.', author: '최산부' },
      { time: full(-1, '15:30'), dept: 'OB', text: '예정 제왕절개 시행. 여아 3.2kg, Apgar 8/9. 출혈량 약 500mL. 수술 후 자궁 수축 양호, 오로 소량.', author: '송자궁' },
    ],
    orders: [
      sec('▶ 기본처방 ◀'),
      od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'),
      od('Check I/O q [8] hrs', '', '', '', '', '', [], '1'),
      od('자궁저부 높이·긴장도 및 오로 양상 관찰 q [4] hrs', '', '', '', '', '', [], '1'),
      od('조기 보행 (수술 후 8시간부터)', '', '', '', '', '', [], '1'),
      od('모자동실 및 모유수유 시작', '', '', '', '', '집계완료'),
      od('Foley catheter 제거', '', '', '', '', '집계완료', [], '1'),
      sec('▶ 식사 처방 ◀'),
      od('연식 (soft diet)', '', '', '', '', '집계완료'),
      sec('▶ 주사약 ◀'),
      od('Cefazolin 1g/V (세파졸린)', '1', 'g', '3회', 'IV', '집계완료', ['06:00/최', '14:00/박', '22:00/'], '1'),
      od('Oxytocin 20U in 1L LR (옥시토신)', '20', 'U', '지속', 'IV', '집계완료', ['06:00/최'], '', ''),
      memo('※ 고위험 약물: 속도 이중확인. 수축 양호 시 중단.'),
      od('Ketorolac 30mg/mL (케토롤)', '30', 'mg', '3회', 'IV', '집계완료', ['06:00/최', '14:00/박', '22:00/'], '1'),
      od('Tramadol 50mg/mL (트라마돌)', '50', 'mg', '1회', 'IV', '', [], '', 'PRN'),
      memo('※ NRS 5 이상 시. 최소투여간격 6시간.'),
      sec('▶ 먹는약 ◀'),
      od('Acetaminophen 650mg (타이레놀)', '1', 'T', '3회', 'PO', '집계완료', ['09:00/박', '15:00/', '21:00/'], '1'),
      od('Ferrous sulfate 200mg (훼로바)', '1', 'T', '1회', 'PO', '집계완료', ['09:00/박'], '1'),
      od('Docusate 100mg (둘코락스)', '1', 'T', '2회', 'PO', '집계완료', ['09:00/박', '21:00/'], '1'),
      sec('▶ 검 사 ◀'),
      od('CBC', '', '', '', '', '집계완료', [], '1'),
    ],
    mar: [
      mar(full(0, '09:05'), 'Acetaminophen 650mg (타이레놀)', '1T', 'PO', '09:00', '박간호'),
      mar(full(0, '09:10'), 'Ferrous sulfate 200mg (훼로바)', '1T', 'PO', '09:00', '박간호'),
      mar(full(0, '06:05'), 'Ketorolac 30mg/mL (케토롤)', '30mg', 'IV', '06:00', '최간호'),
      mar(full(-1, '23:20'), 'Tramadol 50mg/mL (트라마돌)', '50mg', 'IV', 'PRN', '김간호', { note: '통증 NRS 7 호소, 1시간 후 NRS 4' }),
    ],
    vitals: [
      vit(md(-1, '17:30'), '110/68', '88', '18', '36.8', '99', '6'),
      vit(md(-1, '20:00'), '108/66', '86', '18', '37.0', '99', '6'),
      vit(md(-1, '23:30'), '106/64', '90', '18', '37.2', '98', '7'),
      vit(md(0, '04:00'), '110/68', '84', '18', '37.2', '98', '5'),
      vit(md(0, '08:00'), '112/70', '84', '18', '37.3', '98', '5'),
    ],
    io: [
      { time: `${dt(-1)} E`, intake: 'IV 1,500', output: '소변 600 / 출혈 500(수술 중)', note: 'Foley 유지, 오로 소량' },
      { time: `${dt(-1)} N`, intake: 'IV 800', output: '소변 700', note: '' },
      { time: `${dt(0)} D`, intake: 'PO 300 / IV 500', output: '소변 450', note: 'Foley 제거 후 자가 배뇨 확인' },
    ],
    labs: [
      { name: 'Hb', value: '12.1', unit: 'g/dL', min: '12', max: '16', sample: 'Blood', time: md(-2, '10:00') },
      { name: 'Hb', value: '10.2', unit: 'g/dL', min: '12', max: '16', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Hct', value: '31.0', unit: '%', min: '36', max: '46', sample: 'Blood', time: md(0, '05:30') },
      { name: 'WBC', value: '12.8', unit: '10^3/uL', min: '4.0', max: '10.0', sample: 'Blood', time: md(0, '05:30') },
      { name: 'Plt', value: '210', unit: '10^3/uL', min: '150', max: '400', sample: 'Blood', time: md(0, '05:30') },
    ],
    notes: [
      { time: md(0, '10:20'), focus: '자궁 수축', text: 'S)\n"배가 쥐어짜는 것처럼 아파요. 젖 물릴 때 더 심해요."\n\nO)\n자궁저부 배꼽 아래 1FB, 단단함, 오로 rubra 소량(패드 1/4), 응고물 없음. BP 112/70, HR 84.\n\nA)\n정상적인 후진통(수유 시 옥시토신 분비)으로 판단함.\n\nI)\n자궁저부 마사지 방법과 정상 오로 양상 설명, 처방 진통제 투여 후 수유 격려함.\n\nE)\n후진통이 정상임을 이해하고 오로가 소독 패드 1시간 내 가득 차면 호출하겠다고 말함.', author: '박간호', shift: 'D' },
      { time: md(0, '08:30'), focus: '모유수유', text: 'S)\n"아기가 젖을 잘 못 물어요. 젖꼭지가 아파요."\n\nO)\n신생아 입을 크게 벌리지 않고 얕게 물림, 유두 발적 없음. 유방 부드러움, 초유 소량 확인.\n\nA)\n올바른 젖 물리기 자세가 필요함(비효율적 모유수유).\n\nI)\n수술 부위를 피하는 풋볼 자세와 측와위 자세 시범, 유륜까지 깊게 물리는 방법 교육함.\n\nE)\n산모가 풋볼 자세로 수유하고 아기가 깊게 물고 삼키는 소리 확인됨.', author: '박간호', shift: 'D' },
      { time: md(-1, '22:00'), focus: '급성 통증', text: 'D)\n23:20 수술 부위 통증 NRS 7 호소, 기침·체위 변경 시 악화.\n\nA)\n처방에 따라 tramadol 50mg IV 투여함. 복부 지지 시범 및 체위 변경 도움.\n\nR)\n1시간 후 NRS 4로 감소함.', author: '김간호', shift: 'E' },
    ],
    care: [
      { dx: '급성 통증', data: '수술 부위 NRS 5~7, 후진통, 움직일 때 악화', goal: '48시간 내 NRS 3 이하', plan: '통증 사정, 처방 진통제, 복부 지지, 수유 자세 조정, 체위 변경', eval: '진행 중. NRS 4~5.' },
      { dx: '비효율적 모유수유', data: '신생아가 유륜을 깊게 물지 못함, 유두 통증, 초유 소량', goal: '퇴원 전 올바른 자세로 수유하고 아기가 효과적으로 젖을 빨음', plan: '수유 자세 시범, 젖 물리기 교육, 모자동실, 수유 일지', eval: '부분 달성. 풋볼 자세에서 수유 가능.' },
      { dx: '감염 위험성', data: '제왕절개 상처, 오로, Foley 유치 후 제거, WBC 12.8', goal: '퇴원 시 감염 징후 없음', plan: '상처 관찰, 항생제 투여, 회음부·손 위생, 오로 양상 관찰', eval: '진행 중.' },
      { dx: '지식부족', data: '산후 회복 과정과 자궁 마사지, 산욕기 주의 증상을 모름', goal: '퇴원 전 산욕기 위험 징후를 설명할 수 있음', plan: '산욕기 간호 교육(오로, 자궁 마사지, 위험 증상), 피임·부부 생활 안내', eval: '' },
    ],
    lines: [
      { kind: 'IV catheter', site: '좌측 손등 18G', ins: dt(-1), chg: dt(2), out: '', st: '유지', note: '수술 전 삽입' },
      { kind: 'Foley catheter', site: '16Fr', ins: dt(-1), chg: '', out: '소변 투명 황색', st: '제거', note: `${dt(0)} 제거` },
    ],
    iv: [
      { time: '06:00', fluid: 'Oxytocin 20U in LR 1L', rate: '125', remain: '350', site: '좌측 손등 18G', st: '중단', by: '최간호' },
      { time: '14:00', fluid: 'D5 0.45% N/S 1L', rate: '80', remain: '', site: '좌측 손등 18G', st: '주입 중', by: '박간호' },
    ],
    wounds: [
      { time: md(0, '09:30'), site: '하복부 횡절개 (약 12cm)', kind: '수술 상처', size: '12', look: '삼출물 없음, 발적·부종 없음, 가장자리 접근 양호', dress: '방수 필름 드레싱', by: '박간호' },
    ],
    edu: [
      { time: md(0, '11:00'), topic: '모유수유 자세와 젖 물리기', target: '환자', method: '시범', under: '충분', by: '박간호' },
      { time: md(0, '10:30'), topic: '자궁저부 마사지와 정상 오로', target: '환자·보호자', method: '시범', under: '충분', by: '박간호' },
      { time: md(-1, '20:00'), topic: '기침 시 복부 지지, 조기 보행의 필요성', target: '환자', method: '구두', under: '충분', by: '김간호' },
    ],
    specimen: [
      { time: md(0, '05:30'), test: 'CBC', tube: 'EDTA', st: '결과', by: '최간호' },
    ],
    transport: [
      { time: md(-1, '13:00'), from: '41병동', to: '분만수술실', mode: '침대', escort: '수술실 간호사', st: '복귀' },
    ],
    moves: [],
    anes: [
      { time: md(-1, '13:30'), ev: '마취 전 평가', detail: 'ASA class I, NPO 8시간 확인', by: '마취통증의학과' },
      { time: md(-1, '13:50'), ev: '마취 시작', detail: '척추마취(L3-4), 0.5% bupivacaine 10mg + morphine 0.1mg', by: '마취통증의학과' },
      { time: md(-1, '14:15'), ev: '수술 시작', detail: '', by: '마취통증의학과' },
      { time: md(-1, '14:30'), ev: '기타', detail: '신생아 출생, Oxytocin 투여 시작, BP 저하(92/54) → phenylephrine 투여 후 회복', by: '마취통증의학과' },
      { time: md(-1, '15:20'), ev: '수술 종료', detail: '출혈 약 500mL', by: '마취통증의학과' },
    ],
    surgery: [
      { date: dt(-1), dept: 'OB', name: 'Repeat low transverse cesarean section', anes: '척추마취', note: '여아 3.2kg, Apgar 8/9, 출혈 500mL, 자궁 수축 양호' },
    ],
    forms: {
      morse: [morse(md(0, '08:00'), [0, 0, 0, 1, 1, 0])],
      braden: [braden(md(0, '08:00'), [3, 2, 2, 3, 2, 2])],
      pain: [painForm(md(0, '09:30'), '5', '하복부 수술 부위', '쑤심', '움직일 때', '일어날 때, 기침', '안정, 복부 지지', 'Acetaminophen 투여, 복부 지지 교육', '3')],
      preop: [preop(md(-1, '11:30'), ALL13.filter(n => n !== 12), '혈액 준비: 필요 시 crossmatch 가능으로 확인')],
    },
    handover: [
      { time: md(0, '07:00'), s: '밤새 통증 NRS 7로 PRN 1회, 현재 NRS 5. Foley 제거 예정', b: '예정 제왕절개 후 1일, 모유수유 중, 신생아 모자동실', a: 'BT 37.3, 자궁저부 배꼽 아래 1FB firm, 오로 소량, 가스 배출 전', r: 'Foley 제거 후 자가 배뇨 확인, 보행 격려, 모유수유 교육, 가스 배출 확인', author: '최간호' },
    ],
    memos: [
      { time: md(0, '09:00'), type: '진료메모', text: 'Foley 제거, 연식 시작. Hb 10.2로 경구 철분제. 내일 상처 소독 후 퇴원 가능 여부 판단.', author: '최산부', shift: 'D' },
      { time: md(0, '10:40'), type: '간호메모', text: '아기 수유 시 유두 통증 호소, 젖 물리는 법 교육함. 오후에 모유수유 클리닉 상담 의뢰 예정.', author: '박간호', shift: 'D' },
    ],
    consent: [
      consent('입원 동의서', dt(-2), '최산부', '본인', '정미경'),
      consent('수술 동의서', dt(-2), '최산부', '본인', '정미경'),
      consent('마취 동의서', dt(-2), '최산부', '본인', '정미경'),
      consent('수혈 동의서', dt(-2), '최산부', '본인', '정미경'),
    ],
    imaging: [],
    nutrition: [
      { time: full(0, '09:30'), text: '산욕기 영양: 모유수유로 칼로리 +500kcal, 철분·단백질·수분 충분히 섭취 권고. 변비 예방을 위해 식이섬유 섭취 안내.', author: '영양사' },
    ],
    appts: [
      { date: dt(9), time: '10:00', dept: 'OB', doc: '최산부', purpose: '산후 1주 외래 (상처 확인, 실밥 제거)', st: '예약' },
      { date: dt(40), time: '10:30', dept: 'OB', doc: '최산부', purpose: '산후 6주 검진', st: '예약' },
    ],
    history: [
      { dept: 'OB', date: dt(-1500), dx: 'Cesarean section', code: 'O82', kind: '입원' },
    ],
  },
};
