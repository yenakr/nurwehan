import type { Row, Sample } from './types';
import { residentName } from './names';

// 새 기능(상병코드, 식이처방, 중증도, 서식지, 퇴원예고 등)에 맞춰 예시 환자 자료를 채운다.
// 이미 값이 있는 항목은 건드리지 않는다.
const DXC: Record<string, [string, string, string][]> = {
  adult: [['주상병', 'I50.0', '울혈심부전'], ['부상병', 'I10', '본태성 고혈압'], ['부상병', 'I20.9', '협심증']],
  child: [['주상병', 'J21.9', '급성 세기관지염']],
  er1: [['주상병', 'I21.1', '급성 하벽 심근경색증'], ['부상병', 'I49.0', '심실세동']],
  er2: [['주상병', 'S93.4', '발목 염좌']],
  gi: [['주상병', 'K26.4', '출혈을 동반한 십이지장 궤양'], ['부상병', 'B98.0', '헬리코박터 파일로리 감염'], ['부상병', 'D64.9', '빈혈']],
  gs: [['주상병', 'K35.8', '급성 충수염']],
  op1: [['주상병', 'E11.4', '당뇨병성 신경병증을 동반한 제2형 당뇨병']],
  op2: [['주상병', 'K81.0', '급성 담낭염']],
  os: [['주상병', 'M17.9', '무릎 관절증']],
  psych: [['주상병', 'F20.9', '조현병']],
  pul: [['주상병', 'J18.9', '상세불명의 폐렴'], ['부상병', 'J10.1', '인플루엔자 (A형)']],
  women: [['주상병', 'O82', '제왕절개 분만']],
};

const ymd = (v?: string) => (v || '').slice(0, 10);

// 샘플 데이터 버전: 올리면 이전 버전으로 저장된 미제출 샘플 차트는 정리되고 새 데이터로 다시 열린다.
export const SAMPLE_VER = '8';

const CONSULT: Record<string, [string, string, string, string][]> = {
  adult: [['RM', '심장재활 교육 및 운동처방 의뢰', '퇴원 후 외래 재활 프로그램 등록 권고', '회신완료']],
  pul: [['ID', '폐렴 항생제 조정 문의', '', '진행중']],
  gi: [['GS', '지속 출혈 시 수술적 처치 가능성 문의', '내시경 지혈 후 경과 관찰, 재출혈 시 재의뢰', '회신완료']],
  gs: [['AN', '수술 전 마취 평가', '', '접수']],
  os: [['RM', '수술 후 재활치료 의뢰', '', '접수']],
  women: [['PD', '신생아 진료 의뢰', '신생아 정상, 수유 교육 권고', '회신완료']],
  child: [['NU', '영양 상담 의뢰', '', '접수']],
  psych: [['NE', '신경학적 검진 의뢰', '', '접수']],
};
const NOTI: Record<string, [string, string, string][]> = {
  adult: [['08:40', '호흡곤란 호소, SpO₂ 93% — 확인 부탁드립니다.', '1'], ['11:20', '이뇨제 투여 후 소변량 확인 요청', '']],
  pul: [['09:10', '야간 기침·가래 증가, 객담 양상 확인 부탁드립니다.', '']],
  gi: [['07:50', 'Hb 재검 결과 확인 요청', '']],
  gs: [['10:05', '수술 부위 통증 NRS 6점, 진통제 추가 요청', '']],
  os: [['09:30', '수술 부위 배액량 증가, 확인 부탁드립니다.', '']],
  women: [['08:15', '자궁 수축 양호, 오로 양 보고', '']],
  child: [['09:00', '체온 38.1℃, 해열제 투여 여부 확인 요청', '1']],
  psych: [['10:30', '불안 호소, 필요시 처방 확인 요청', '']],
};
const DOCREQ: Record<string, [string, string, string]> = {
  adult: ['입퇴원확인서', '1', '원무과 수령'], gs: ['진단서', '1', '병동 수령'], os: ['입퇴원확인서', '2', '원무과 수령'],
  women: ['출생증명서', '1', '원무과 수령'], child: ['입퇴원확인서', '1', '원무과 수령'],
};
const COMM: Record<string, string> = {
  adult: '낙상 위험 환자, 보호자 상주 요청드림.', pul: '격리 해제 여부 의사 확인 후 공지 예정.', gi: '금식 유지, 내시경 일정 확정 시 공유 바람.',
  gs: '수술 후 첫 보행 시 보조 필요.', os: '체중부하 제한 안내 및 보조기 착용 확인.', women: '모유수유 교육 완료, 산욕기 교육 예정.',
  child: '보호자 교육(해열제 투여 간격) 시행.', psych: '면회 제한 환자, 보호자 연락처 확인 필요.',
};
const DIET: Record<string, [string, string]> = {
  adult: ['저염식(2g Na) / 수분 1,000mL 제한', '심부전'], pul: ['일반식', ''], gi: ['금식 → 죽식 (출혈 확인 후)', '소화성궤양'], gs: ['수술 후 단계식 (물 → 죽 → 일반)', ''],
  os: ['일반식', ''], women: ['산욕기 일반식', ''], child: ['소아 일반식', ''], psych: ['일반식', ''],
};

export function enrich(s: Sample): Sample {
  const d = s.data;
  const info = d.info;
  const ward = info.ward || '';
  const inpatient = ward !== '외래' && ward !== '응급실';
  const orders: Row[] = d.orders || [];
  const out: Partial<typeof d> = {};
  const day = ymd(info.orderDate) || ymd(info.admit);
  const key = s.key;
  out.info = { ...info, dataVer: SAMPLE_VER, ...(inpatient && info.dept && !info.attending ? { attending: residentName(info.dept) } : {}) };

  // 처방: 단독투여·비급여 표시
  if (orders.length && !orders.some(r => r.opt)) {
    out.orders = orders.map(r => {
      if (r.kind === 'sec' || r.kind === 'memo' || !r.name) return r;
      if (/insulin|KCl|potassium|heparin|morphine|fentanyl|vancomycin/i.test(r.name)) return { ...r, opt: '단독' };
      if (/Kabiven|SMOF|Winuf|Omegaven|비타민|vitamin/i.test(r.name)) return { ...r, opt: '비급여' };
      return r;
    });
  }
  // 협진: 의뢰일·회신의·실시일 칸 채움
  const cons: Row[] = (d.consult || []).map(r => ({ rdoc: r.st === '회신완료' ? '회신의' : '', perf: r.st === '회신완료' ? r.date || day : '', ...r }));
  if (inpatient && !cons.length && CONSULT[key]) CONSULT[key].forEach(([rdept, req, reply, st]) => cons.push({ date: day, dept: info.dept || '', doc: info.doctor || '', req, rdept, reply, st, rdoc: st === '회신완료' ? '회신의' : '', perf: st === '회신완료' ? day : '' }));
  if (cons.length) out.consult = cons;
  // 식이처방이 비었으면 사례별 기본 식이
  if (!d.dietord?.length && !out.dietord && inpatient && DIET[key]) out.dietord = [{ start: ymd(info.admit), end: '', type: DIET[key][0], st: '등록', by: info.doctor || '', note: DIET[key][1] }];
  // 노티·서류요청·간호의사소통(메모 행)
  const memos: Row[] = d.memos || [];
  const add: Row[] = [];
  if (inpatient && !memos.some(m => m.type === '노티')) (NOTI[key] || []).forEach(([hm, text, u]) => add.push({ type: '노티', text, doctor: info.doctor || '', rank: '주치의', dept: info.dept || '', urgent: u, status: '발송', time: `${day} ${hm}`, author: '박간호', shift: 'D' }));
  if (inpatient && DOCREQ[key] && !memos.some(m => m.type === '서류요청')) add.push({ type: '서류요청', text: DOCREQ[key][0], copies: DOCREQ[key][1], how: DOCREQ[key][2], note: '', status: '요청', time: `${day} 09:20`, author: '박간호', shift: 'D' });
  if (inpatient && COMM[key] && !memos.some(m => m.type === '간호의사소통')) add.push({ type: '간호의사소통', text: COMM[key], time: `${day} 08:00`, author: '박간호', shift: 'D' });
  if (add.length) out.memos = [...memos, ...add];

  if (!d.dxcode?.length && DXC[s.key]) {
    out.dxcode = DXC[s.key].map(([kind, code, name]) => ({ kind, code, name, date: ymd(info.admit), doc: info.doctor || '' }));
  }
  if (!d.acu?.length && d.risk?.length) {
    out.acu = d.risk.filter(r => /위험/.test(r.level || '')).map(r => ({
      date: ymd(info.admit), level: /고위험/.test(r.level || '') ? '3군' : '2군', risk: (r.kind || '').split('(')[0], by: r.author || '', note: r.plan || '',
    }));
  }
  if (!d.dietord?.length) {
    const rows: Row[] = [];
    let on = false;
    orders.forEach(r => {
      if (r.kind === 'sec') { on = /식/.test(r.name || ''); return; }
      if (on && r.kind !== 'memo' && (r.name || '').trim()) rows.push({ start: ymd(info.admit), end: r.pri === 'D/C' ? ymd(info.orderDate) : '', type: r.name || '', st: r.pri === 'D/C' ? '중지' : '등록', by: info.doctor || '', note: '' });
    });
    if (rows.length) out.dietord = rows;
  }
  if (inpatient && !d.docs?.length) {
    const docs: Row[] = [
      { name: '입원생활안내문', date: ymd(info.admit), st: '설명 완료', by: '박간호', note: '' },
      { name: '개인정보 동의서', date: ymd(info.admit), st: '스캔 등록', by: '박간호', note: '' },
    ];
    if (d.risk?.some(r => /낙상/.test(r.kind || '') && /위험/.test(r.level || ''))) docs.push({ name: '낙상예방 안내문', date: ymd(info.admit), st: '설명 완료', by: '박간호', note: '보호자 서명 받음' });
    out.docs = docs;
  }
  if (info.disDate && !d.dcnote?.length) {
    out.dcnote = [{ date: info.disDate, doc: info.doctor || '', plan: '퇴원', diet: '미확인', note: '' }];
  }
  if (info.disDate && !d.dcmed?.length) {
    const meds = orders.filter(r => r.kind !== 'sec' && r.kind !== 'memo' && r.pri !== 'D/C' && r.pri !== 'PRN' && r.pri !== 'STAT' && r.route === 'PO' && r.dose);
    if (meds.length) out.dcmed = meds.map(r => ({ name: r.name || '', dose: `${r.dose}${r.unit || ''}`, cnt: r.cnt || '', days: '14', st: '미확인', note: '' }));
  }
  if (inpatient && !d.sched?.length) {
    let lab = false;
    const rows: Row[] = [];
    orders.forEach(r => {
      if (r.kind === 'sec') { lab = /검\s*사/.test(r.name || ''); return; }
      if (lab && r.kind !== 'memo' && (r.name || '').trim() && (r.st === '접수' || !r.st)) rows.push({ time: '', kind: '검사', name: r.name || '', prep: '', st: '예정' });
    });
    if (rows.length) out.sched = rows;
  }
  return Object.keys(out).length ? { ...s, data: { ...d, ...out } } : s;
}
