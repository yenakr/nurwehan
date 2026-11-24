import type { Row, Sample } from './types';

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

export function enrich(s: Sample): Sample {
  const d = s.data;
  const info = d.info;
  const ward = info.ward || '';
  const inpatient = ward !== '외래' && ward !== '응급실';
  const orders: Row[] = d.orders || [];
  const out: Partial<typeof d> = {};

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
