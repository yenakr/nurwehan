// 핵심술기 시나리오: 설정(cfg) → 가상 차트 · 상황 브리핑 · 채점 기준. 교수가 cfg를 고쳐 출제한다.
import { emptyChart, migrate, shiftChart, type ChartData, type Row } from '../types';
import { od, vit, sec, memo, full, dt } from '../cases/h';

export type Drug = { name: string; alias: string; dose: string; unit: string; route: string };
export type Cfg = {
  name: string; age: string; sex: 'M' | 'F'; dx: string; allergy: string; ward: string; bed: string;
  med: { sbp: string; dbp: string; hr: string; bt: string; holdBelow: string; give: Drug; bpDrug: Drug; allergyDrug: Drug; prnDrug: Drug };
  braden: { s: number[]; site: string; stage: string; size: string };
  vital: { time: string; sbp: string; dbp: string; hr: string; rr: string; bt: string; spo2: string; pain: string };
};
export type Item = { id: string; group: string; label: string; tip: string; ok: boolean; avoid?: boolean };
export type Tbl = { cap: string; head: string[]; rows: string[][] };
export const SKILLS: { key: string; title: string }[] = [{ key: 'med', title: '투약' }, { key: 'braden', title: '욕창사정' }, { key: 'vital', title: '활력징후·임상관찰' }];

export const DEFAULT_CFG: Cfg = {
  name: '박서연', age: '67', sex: 'F', dx: 'Community-acquired pneumonia', allergy: '페니실린 (전신 발진)', ward: '61병동', bed: '608-1',
  med: {
    sbp: '96', dbp: '58', hr: '88', bt: '36.8', holdBelow: '100',
    give: { name: 'Furosemide 20mg/A (라식스)', alias: 'furosemide,푸로세미드,라식스', dose: '20', unit: 'mg', route: 'IV' },
    bpDrug: { name: 'Amlodipine 5mg (아모디핀)', alias: 'amlodipine,암로디핀,아모디핀', dose: '5', unit: 'mg', route: 'PO' },
    allergyDrug: { name: 'Amoxicillin/Clavulanate 1.2g/V (아목시클란)', alias: 'amoxicillin,아목시실린,아목시클란,클라불란', dose: '1.2', unit: 'g', route: 'IV' },
    prnDrug: { name: 'Acetaminophen 500mg (타이레놀)', alias: 'acetaminophen,아세트아미노펜,타이레놀', dose: '500', unit: 'mg', route: 'PO' },
  },
  braden: { s: [3, 2, 1, 2, 2, 1], site: '천골', stage: '1단계', size: '3×2cm' },
  vital: { time: '14:00', sbp: '98', dbp: '60', hr: '112', rr: '24', bt: '38.4', spo2: '93', pain: '6' },
};

// 시나리오 종류별 환자 기본(같은 cfg 하나에 세 술기 값이 같이 들어 있고, 술기 key로 골라 쓴다)
export const DEFAULTS: Record<string, Partial<Cfg>> = {
  med: {},
  braden: { name: '이정식', age: '81', sex: 'M', dx: 'Cerebral infarction', allergy: '무', ward: '91병동', bed: '905-2' },
  vital: { name: '최민준', age: '55', sex: 'M', dx: 'Generalized peritonitis, POD#1', allergy: '무', ward: '81병동', bed: '810-1' },
};
export const defaultCfg = (skill: string): Cfg => JSON.parse(JSON.stringify({ ...DEFAULT_CFG, ...(DEFAULTS[skill] || {}) }));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alias = (d: Drug) => new RegExp([d.name.split(/[\s(]/)[0], ...d.alias.split(',')].map(x => x.trim()).filter(Boolean).map(esc).join('|'), 'i');
const hold = /보류|hold|투여하지|투약하지|주지|투여\s*안|투약\s*안/i;
const T = (...r: RegExp[]) => r;

// ---- 무작위 변형 (학생마다 다른 문제) ----
const NAMES = ['김하늘', '정우진', '한서윤', '오지훈', '윤채원', '강도현', '임수아', '배준호', '서민재', '조은비', '신태양', '문지안'];
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; };
}
export function vary(cfg: Cfg, skill: string, seed: string): Cfg {
  const r = rng(seed);
  const pick = <X,>(a: X[]) => a[Math.floor(r() * a.length)];
  const n = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const c: Cfg = JSON.parse(JSON.stringify(cfg));
  c.name = pick(NAMES); c.age = String(Number(c.age) + n(-4, 4));
  c.bed = `${c.bed.split('-')[0].slice(0, 1)}${String(n(1, 12)).padStart(2, '0')}-${n(1, 4)}`;
  if (skill === 'med') {
    const hb = Number(c.med.holdBelow) || 100;
    c.med.sbp = String(hb - n(4, 14)); c.med.dbp = String(n(50, 62)); c.med.hr = String(n(70, 98)); c.med.bt = (36.4 + n(0, 6) / 10).toFixed(1);
  } else if (skill === 'braden') {
    const ok = [[1, 3], [1, 3], [1, 2], [1, 3], [1, 3], [1, 2]];
    let s = ok.map(([a, b]) => n(a, b));
    while (s.reduce((x, y) => x + y, 0) > 14) s = ok.map(([a, b]) => n(a, b));
    c.braden.s = s; c.braden.stage = pick(['1단계', '1단계', '2단계']); c.braden.site = pick(['천골', '천골', '뒤꿈치', '대전자부']);
    c.braden.size = `${n(2, 4)}×${n(1, 3)}cm`;
  } else {
    c.vital.bt = (37.9 + n(0, 12) / 10).toFixed(1); c.vital.hr = String(n(100, 126)); c.vital.rr = String(n(21, 28));
    c.vital.spo2 = String(n(90, 94)); c.vital.sbp = String(n(92, 108)); c.vital.dbp = String(n(56, 68)); c.vital.pain = pick(['4', '6', '8']);
  }
  return c;
}

// ---- 차트 ----
const mk = (key: string, cfg: Cfg, info: Record<string, string>, clock: string, fill: (d: ChartData) => void): ChartData => {
  const d = emptyChart();
  d.info = {
    mode: 'skill', skill: key, sampleKey: `sk:${key}`, skCfg: JSON.stringify(cfg), dept: 'GS', doctor: '김담당', orderDate: dt(0), admit: dt(-3),
    height: '165', weight: '58', iso: '', npo: '0', surg: '0', lang: '한국어',
    ptNo: String(9100 + Math.floor(Math.random() * 800)), name: cfg.name, ageSex: `${cfg.age}/${cfg.sex}`, ward: cfg.ward, bed: cfg.bed, allergy: cfg.allergy, dx: cfg.dx, ...info,
    vbase: full(0, clock), slotDay: dt(0), dataVer: 'sk2',
  };
  fill(d);
  return shiftChart(migrate(d));
};
const basic = () => [sec('▶ 기본처방 ◀'), od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'), od('Check I/O q [8] hrs', '', '', '', '', '', [], '1')];
const drugRow = (d: Drug, cnt: string, slots: string[]) => od(d.name, d.dose, d.unit, cnt, d.route, '집계완료', slots, '1');
const nowOf = (hm: string, back: number) => { const [h, m] = hm.split(':').map(Number); const t = h * 60 + m - back; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

export function buildChart(skill: string, cfg: Cfg): { title: string; data: ChartData } | null {
  const sk = SKILLS.find(s => s.key === skill);
  if (!sk) return null;
  const title = `[술기] ${sk.title} · ${cfg.name}`;
  if (skill === 'med') {
    const m = cfg.med;
    return { title, data: mk(skill, cfg, { dept: 'PUL', doctor: '최호흡', cc: '기침, 가래, 발열' }, '08:50', d => {
      d.orders = [
        ...basic(), sec('▶ 주사약 ◀'), drugRow(m.give, '1회', ['09:00/']), drugRow(m.allergyDrug, '3회', ['09:00/', '17:00/', '01:00/']),
        sec('▶ 먹는약 ◀'), drugRow(m.bpDrug, '1회', ['09:00/']), memo(`※ SBP ${m.holdBelow} 미만 시 보류 후 의사에게 보고`),
        od(m.prnDrug.name, m.prnDrug.dose, m.prnDrug.unit, '0회/4회', m.prnDrug.route, '', [], '', 'PRN'), memo('※ 체온 38.0℃ 이상일 때'),
      ];
      d.vitals = [vit(full(0, '04:00'), '110/68', '84', '18', '36.9', '96'), vit(full(0, '08:50'), `${m.sbp}/${m.dbp}`, m.hr, '18', m.bt, '96')];
    }) };
  }
  if (skill === 'braden') {
    return { title, data: mk(skill, cfg, { dept: 'NS', doctor: '정신경', cc: '좌측 편마비', weight: '60' }, '10:00', d => {
      d.orders = [...basic(), od('Position change q [2] hrs', '', '', '', '', '', [], '1'), od('Regular diet (연하곤란 주의)', '', '', '', '', '집계완료')];
      d.vitals = [vit(full(0, '08:00'), '128/76', '74', '18', '36.6', '97')];
    }) };
  }
  const v = cfg.vital;
  return { title, data: mk(skill, cfg, { dept: 'GS', doctor: '한외과', cc: '복통' }, nowOf(v.time, 5), d => {
    d.orders = [...basic(), sec('▶ 먹는약 ◀'), od('Acetaminophen 650mg (타이레놀)', '650', 'mg', '0회/4회', 'PO', '', [], '', 'PRN'), memo('※ 체온 38.0℃ 이상일 때')];
    d.vitals = [vit(full(0, '10:00'), '118/72', '84', '18', '37.2', '97', '3')];
  }) };
}

// ---- 상황 브리핑 ----
const OBS: Record<string, string[]> = {
  sen: ['', '자극에 거의 반응이 없고 불편함을 표현하지 못함', '통증 자극에만 반응하며 신음·안절부절로만 불편함을 표현함', '말을 걸면 반응하지만 불편함을 항상 표현하지는 못하고 스스로 몸을 뒤척이지 못함', '말에 반응하고 불편함을 말로 호소할 수 있음'],
  moi: ['', '땀·소변 등으로 항상 젖어 있고 움직일 때마다 젖은 것이 관찰됨', '기저귀 사용. 근무조마다 1회 이상 기저귀·침구를 교환함', '하루 1회 정도 침구를 교환함', '거의 젖지 않고 일상적인 교환만 함'],
  act: ['', '침상에서만 지냄 (침상 안정)', '걷지 못하거나 걸음이 매우 제한되어 의자·휠체어로 이동함', '낮에 가끔 짧게 걷고 대부분 침상이나 의자에서 지냄', '하루 2회 이상 병실 밖에서 걸음'],
  mob: ['', '도움 없이는 몸 위치를 전혀 바꾸지 못함', '가끔 팔다리를 약간 움직이나 스스로 체위변경은 못함', '스스로 자주 조금씩 위치를 바꿈', '도움 없이 자유롭게 체위변경함'],
  nut: ['', '식사를 1/3 이하 먹거나 금식·유동식만 함', '식사는 보통 절반 이하 섭취', '식사의 절반 넘게 섭취', '매 끼니 대부분 섭취'],
  fri: ['', '이동 시 도움이 많이 필요하고 침대에서 자주 미끄러져 내려옴', '이동 시 약간의 도움이 필요하고 가끔 미끄러짐', '스스로 이동하며 자세를 유지함'],
};
const KEYS = ['sen', 'moi', 'act', 'mob', 'nut', 'fri'];
const AREA = ['감각 인지', '습기', '활동', '가동성', '영양', '마찰·전단력'];
export const bradenTotal = (s: number[]) => s.reduce((a, b) => a + b, 0);
export const bradenRisk = (n: number) => (n <= 9 ? '초고위험' : n <= 12 ? '고위험' : n <= 14 ? '중등도 위험' : '경미한 위험');
const SKIN = (b: Cfg['braden']) => b.stage === '2단계'
  ? `${b.site} 부위에 표피 일부가 벗겨지고 분홍색 얕은 개방 상처(또는 물집)가 있음 (약 ${b.size})`
  : `${b.site} 부위에 손가락으로 눌러도 하얗게 변하지 않는 붉은 발적, 피부 손상 없음 (약 ${b.size})`;

export function briefOf(skill: string, cfg: Cfg, hideAnswers = false): Tbl[] {
  void hideAnswers;
  if (skill === 'med') {
    const m = cfg.med;
    return [{ cap: '시간', head: ['내용'], rows: [['09:00 투약 시간입니다. 오더와 투약 직전 임상관찰을 확인하고 PDA로 투약하세요.']] }, { cap: '환자 정보', head: ['항목', '내용'], rows: [['알레르기', cfg.allergy], ['진단', cfg.dx], ['투약 직전 혈압', `${m.sbp}/${m.dbp}`]] }].slice(0, 2).map(t => t.cap === '환자 정보' ? { ...t, rows: t.rows.slice(0, 2) } : t);
  }
  if (skill === 'braden') {
    return [{ cap: '관찰', head: ['영역', '관찰 내용'], rows: [...cfg.braden.s.map((v, i) => [AREA[i], OBS[KEYS[i]][v] || '']), ['피부', SKIN(cfg.braden)]] }];
  }
  const v = cfg.vital;
  return [
    { cap: `측정기 표시 (${v.time})`, head: ['BP', 'HR', 'RR', 'BT', 'SpO₂'], rows: [[`${v.sbp}/${v.dbp} mmHg`, `${v.hr} 회/분`, `${v.rr} 회/분`, `${v.bt} ℃`, `${v.spo2} % (실내공기)`]] },
    { cap: '그 외 관찰', head: ['항목', '내용'], rows: [['의식', '명료'], ['통증', `복부 수술부위 NRS ${v.pain}점`], ['수술부위', '드레싱 깨끗함, 삼출물 없음'], ['처방', '아세트아미노펜 PRN (체온 38.0℃ 이상)']] },
  ];
}

// ---- 채점 ----
const given = (o: Row | undefined) => !!o && Object.keys(o).some(k => /^t\d+$/.test(k) && /\/\S+/.test(o[k] || ''));
const userNotes = (d: ChartData) => d.notes.filter(n => !/\(PDA/.test(n.text || '')).map(n => `${n.time || ''} ${n.focus || ''} ${n.text || ''}`).join('\n');
const rule = (id: string, label: string, tip: string, test: RegExp[]) => ({ id, label, tip, test });
const SITE_RE: Record<string, RegExp> = { 천골: /천골|sacr/i, 뒤꿈치: /뒤꿈치|발뒤꿈치|heel|종골/i, 대전자부: /대전자|trochan|고관절|엉덩/i, 후두부: /후두|occip|뒤통수/i };

export function noteRules(skill: string, cfg: Cfg) {
  const time = rule('time', '시간 (HH:MM)', '시각을 적습니다.', T(/\d{1,2}\s*:\s*\d{2}|\d{1,2}시/));
  if (skill === 'med') {
    const m = cfg.med;
    return [time,
      rule('id', '환자 확인(팔찌·바코드 스캔)', '환자 팔찌/바코드로 확인한 것을 남깁니다.', T(/팔찌|바코드|스캔|등록번호|환자\s*확인|이름/)),
      rule('drug', '투약한 약·용량·경로', '약명·용량·경로를 함께 적습니다.', T(alias(m.give), new RegExp(esc(m.give.dose), 'i'), new RegExp(esc(m.give.route), 'i'))),
      rule('bp', '투약 전 혈압 수치', `혈압 ${m.sbp}/${m.dbp} 같은 수치를 적습니다.`, T(new RegExp(`${m.sbp}\\s*/\\s*${m.dbp}`))),
      rule('hold1', `${m.bpDrug.name.split(/[\s(]/)[0]} 보류와 사유`, `SBP ${m.holdBelow} 미만이라 보류했다고 적습니다.`, T(alias(m.bpDrug), hold, /혈압|SBP|BP/i)),
      rule('hold2', `${m.allergyDrug.name.split(/[\s/(]/)[0]} 보류와 알레르기 사유`, '알레르기 때문에 보류했다고 적습니다.', T(alias(m.allergyDrug), /알레르기|알러지|allergy/i, hold)),
      rule('report', '의사 보고', '누구에게 보고했고 지시를 받았는지.', T(/보고|연락|notify|처방의|담당의|의사|주치의|dr/i)),
      rule('obs', '투약 후 관찰·반응', '소변량, 혈압, 이상 반응 유무 등.', T(/소변|I\/O|혈압|어지러|반응|이상\s*(없|증상)|관찰|모니터/))];
  }
  if (skill === 'braden') {
    const b = cfg.braden; const t = bradenTotal(b.s); const risk = bradenRisk(t);
    const [w, h] = b.size.replace('cm', '').split('×');
    return [time,
      rule('score', 'Braden 점수', `Braden ${t}점처럼 수치로.`, T(/braden|브레이든/i, new RegExp(`(^|\\D)${t}(\\D|$)`))),
      rule('risk', `위험도 판단 (${risk})`, '점수에 맞는 위험도를 적습니다.', T(risk === '초고위험' ? /초고위험|매우\s*고위험/ : risk === '고위험' ? /고위험/ : risk === '중등도 위험' ? /중등도/ : /경미|저위험/)),
      rule('site', `부위(${b.site})`, '정확한 부위를 적습니다.', T(SITE_RE[b.site] || new RegExp(esc(b.site)))),
      rule('stage', `${b.stage} 소견`, b.stage === '2단계' ? '표피 손실·얕은 개방 상처 소견.' : '눌러도 하얗게 안 변하는 발적, 피부 손상 없음.', T(b.stage === '2단계' ? /2\s*단계|stage\s*2|표피|물집|수포/i : /1\s*단계|stage\s*1|비창백|하얗게\s*변하지|blanch/i)),
      rule('size', `크기 (${b.size})`, '크기를 남깁니다.', T(new RegExp(`${esc(w)}\\s*[x×*]\\s*${esc(h)}|${esc(w)}\\s*cm`, 'i'))),
      rule('act', '시행한 중재', '체위변경, 압력분산 매트리스, 영양 협진 등.', T(/체위\s*변경|체위변환|압력\s*분산|매트리스|협진|영양/)),
      rule('plan', '재사정·보고', '다음 사정 시점 또는 의사·팀 보고.', T(/재사정|재평가|지속\s*관찰|추후|보고|전달|인계/))];
  }
  const v = cfg.vital;
  return [time,
    rule('bp', `혈압 ${v.sbp}/${v.dbp}`, '수치를 그대로.', T(new RegExp(`${v.sbp}\\s*/\\s*${v.dbp}`))),
    rule('hr', `맥박 ${v.hr}`, '수치를 그대로.', T(new RegExp(`(^|\\D)${v.hr}(\\D|$)`))),
    rule('rr', `호흡 ${v.rr}`, '수치를 그대로.', T(new RegExp(`(^|\\D)${v.rr}(\\D|$)`))),
    rule('bt', `체온 ${v.bt}`, '수치를 그대로.', T(new RegExp(esc(v.bt)))),
    rule('spo', `SpO₂ ${v.spo2}`, '수치를 그대로.', T(new RegExp(`${v.spo2}\\s*%|spo2|sp02|산소포화`, 'i'))),
    rule('rep', '의사 보고', '누구에게 보고했는지.', T(/보고|연락|notify|의사|주치의|담당의|sbar/i)),
    rule('act', '중재(해열제·자세·산소 등)', '시행한 처치.', T(/해열|아세트아미노펜|타이레놀|반좌위|산소|냉찜질|수액/)),
    rule('wnd', '수술부위·통증 관찰', '드레싱 상태나 통증 점수.', T(/수술\s*부위|드레싱|삼출|통증|nrs/i)),
    rule('plan', '재측정 계획', '30분~1시간 뒤 재측정.', T(/재측정|재확인|추후|다시\s*측정|경과\s*관찰|모니터/))];
}

export function gradeChart(skill: string, cfg: Cfg, d: ChartData): Item[] {
  const notes: Item[] = noteRules(skill, cfg).map(r => ({ id: `n_${r.id}`, group: '간호기록', label: r.label, tip: r.tip, ok: r.test.every(t => t.test(userNotes(d))) }));
  const byName = (n: string) => d.orders.find(o => o.name === n);
  if (skill === 'med') {
    const m = cfg.med; const nm = (x: Drug) => x.name.split(/[\s/(]/)[0];
    const fu = byName(m.give.name);
    return [
      { id: 'p1', group: '수행', label: `${nm(m.give)} ${m.give.dose}${m.give.unit} ${m.give.route} 투약`, tip: 'PDA로 환자 팔찌 → 약 순서로 스캔해 투약해요.', ok: given(fu) },
      { id: 'p2', group: '수행', label: 'PDA 스캔으로 수행', tip: '오더 화면에서 직접 체크하지 말고 PDA 스캔으로 수행해요.', ok: d.pda.some(e => e.type === 'give' && e.name === m.give.name) },
      { id: 'p3', group: '수행', label: `${nm(m.bpDrug)}은 투약하지 않기 (SBP ${m.sbp})`, tip: `SBP ${m.holdBelow} 미만이면 보류하고 보고해요.`, ok: !given(byName(m.bpDrug.name)), avoid: true },
      { id: 'p4', group: '수행', label: `${nm(m.allergyDrug)}은 투약하지 않기 (알레르기)`, tip: '알레르기 약은 투약 전에 의사에게 확인해요.', ok: !given(byName(m.allergyDrug.name)), avoid: true },
      { id: 'p5', group: '수행', label: `${nm(m.prnDrug)}(PRN)은 주지 않기 (체온 ${m.bt}℃)`, tip: 'PRN은 조건일 때만 줘요.', ok: !given(byName(m.prnDrug.name)), avoid: true },
      { id: 'a1', group: '후 확인', label: 'PC에서 인증저장 (미인증 해소)', tip: '투약 미인증 기록 창에서 인증해요.', ok: given(fu) && !(fu?.ua || '') },
      ...notes,
    ];
  }
  if (skill === 'braden') {
    const b = cfg.braden;
    const r = (d.forms?.braden || []).slice(-1)[0];
    const sc6: Item[] = AREA.map((l, i) => ({ id: `b${i}`, group: '평가도구', label: `Braden ${l}`, tip: '관찰 내용에 맞는 항목을 고르세요.', ok: !!r && r[`q${i}`] !== undefined && r[`q${i}`] !== '' && Number(r[`q${i}`]) === b.s[i] - 1 }));
    const re = SITE_RE[b.site] || new RegExp(esc(b.site));
    return [...sc6, { id: 'w1', group: '상처·피부', label: `${b.site} 부위 기록 (상처·드레싱)`, tip: '상처/드레싱 입력에 부위를 남겨요.', ok: d.wounds.some(w => re.test(`${w.site} ${w.kind}`)) }, ...notes];
  }
  const v = cfg.vital;
  const hh = v.time.slice(0, 2);
  const row = d.vitals.find(x => new RegExp(`(^|\\s)${hh}(:\\d\\d)?\\s*$|${hh}:\\d\\d`).test(`${x.at || ''} ${x.time || ''}`));
  const bp = row ? (row.bp || (row.sbp && row.dbp ? `${row.sbp}/${row.dbp}` : '')) : '';
  const chk = (label: string, got: string | undefined, want: string): Item => ({ id: `v_${label}`, group: '입력', label: `${label} ${want}`, tip: '측정기 화면 값을 그대로 입력해요.', ok: (got || '').trim() === want });
  return [
    chk('혈압', bp, `${v.sbp}/${v.dbp}`), chk('맥박', row?.hr, v.hr), chk('호흡', row?.rr, v.rr), chk('체온', row?.bt, v.bt), chk('SpO₂', row?.spo2, v.spo2),
    { id: 'pn', group: '입력', label: `통증 NRS ${v.pain}`, tip: '통증 점수도 같이 입력해요.', ok: (row?.pain || '') === v.pain },
    { id: 'ac', group: '수행', label: '해열제(PRN) 확인·투약 또는 기록', tip: 'PRN 해열제 조건(38.0℃↑)을 확인해요.', ok: given(d.orders.find(o => /acetaminophen/i.test(o.name || ''))) || /해열|아세트아미노펜|타이레놀/.test(userNotes(d)) },
    ...notes,
  ];
}

export const cfgOf = (info: Record<string, string>): Cfg | null => { try { return info.skCfg ? (JSON.parse(info.skCfg) as Cfg) : null; } catch { return null; } };

// 서버가 받은 설정을 믿지 않고 모양과 범위를 다시 맞춘다
export function cleanCfg(raw: unknown, skill: string): Cfg {
  const base = defaultCfg(skill);
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> & string>;
  const str = (v: unknown, d: string, max = 80) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : d);
  const num = (v: unknown, d: string) => (typeof v === 'string' || typeof v === 'number') && /^\d{1,3}(\.\d)?$/.test(String(v).trim()) ? String(v).trim() : d;
  const drug = (v: unknown, d: Drug): Drug => { const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>; return { name: str(o.name, d.name, 100), alias: str(o.alias, d.alias, 100), dose: str(o.dose, d.dose, 12), unit: str(o.unit, d.unit, 8), route: str(o.route, d.route, 8) }; };
  const o = r as unknown as Record<string, unknown>;
  const m = (r.med || {}) as Record<string, unknown>, b = (r.braden || {}) as Record<string, unknown>, v = (r.vital || {}) as Record<string, unknown>;
  const s = Array.isArray(b.s) ? (b.s as unknown[]).slice(0, 6).map((x, i) => Math.min(i === 5 ? 3 : 4, Math.max(1, Math.round(Number(x)) || base.braden.s[i]))) : base.braden.s;
  return {
    name: str(o.name, base.name, 20), age: num(o.age, base.age), sex: o.sex === 'M' ? 'M' : o.sex === 'F' ? 'F' : base.sex, dx: str(o.dx, base.dx, 100), allergy: str(o.allergy, base.allergy, 60), ward: str(o.ward, base.ward, 12), bed: str(o.bed, base.bed, 10),
    med: { sbp: num(m.sbp, base.med.sbp), dbp: num(m.dbp, base.med.dbp), hr: num(m.hr, base.med.hr), bt: num(m.bt, base.med.bt), holdBelow: num(m.holdBelow, base.med.holdBelow), give: drug(m.give, base.med.give), bpDrug: drug(m.bpDrug, base.med.bpDrug), allergyDrug: drug(m.allergyDrug, base.med.allergyDrug), prnDrug: drug(m.prnDrug, base.med.prnDrug) },
    braden: { s: s.length === 6 ? s : base.braden.s, site: Object.keys(SITE_RE).includes(String(b.site)) ? String(b.site) : base.braden.site, stage: b.stage === '2단계' ? '2단계' : '1단계', size: /^\d(\.\d)?×\d(\.\d)?cm$/.test(String(b.size)) ? String(b.size) : base.braden.size },
    vital: { time: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v.time)) ? String(v.time) : base.vital.time, sbp: num(v.sbp, base.vital.sbp), dbp: num(v.dbp, base.vital.dbp), hr: num(v.hr, base.vital.hr), rr: num(v.rr, base.vital.rr), bt: num(v.bt, base.vital.bt), spo2: num(v.spo2, base.vital.spo2), pain: ['0', '2', '4', '6', '8', '10'].includes(String(v.pain)) ? String(v.pain) : base.vital.pain },
  };
}
export const SITES = Object.keys(SITE_RE);
