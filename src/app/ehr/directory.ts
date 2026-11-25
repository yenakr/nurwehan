import { WARDS, bedLabel } from './samples';

// 병원 구성 (선택지)
export const DEPTS: { code: string; name: string }[] = [
  { code: 'CV', name: '순환기내과' },
  { code: 'PUL', name: '호흡기내과' },
  { code: 'GE', name: '소화기내과' },
  { code: 'EN', name: '내분비내과' },
  { code: 'GS', name: '일반외과' },
  { code: 'OS', name: '정형외과' },
  { code: 'NS', name: '신경외과' },
  { code: 'OB', name: '산부인과' },
  { code: 'PD', name: '소아청소년과' },
  { code: 'PSY', name: '정신건강의학과' },
  { code: 'ER', name: '응급의학과' },
];

export const DOCTORS: { name: string; dept: string }[] = [
  { name: '이순환', dept: 'CV' }, { name: '정심장', dept: 'CV' },
  { name: '최호흡', dept: 'PUL' }, { name: '윤폐', dept: 'PUL' },
  { name: '오소화', dept: 'GE' }, { name: '강위장', dept: 'GE' },
  { name: '서내분', dept: 'EN' }, { name: '한당뇨', dept: 'EN' },
  { name: '장일반', dept: 'GS' }, { name: '백외과', dept: 'GS' },
  { name: '하정형', dept: 'OS' }, { name: '도관절', dept: 'OS' },
  { name: '조신경', dept: 'NS' }, { name: '모뇌', dept: 'NS' },
  { name: '최산부', dept: 'OB' }, { name: '송자궁', dept: 'OB' },
  { name: '박소아', dept: 'PD' }, { name: '유어린', dept: 'PD' },
  { name: '박정신', dept: 'PSY' }, { name: '마음숙', dept: 'PSY' },
  { name: '배응급', dept: 'ER' }, { name: '구급이', dept: 'ER' },
];

export const ALLERGIES = ['무', '페니실린', '아스피린/NSAIDs', '조영제', '설파제', '라텍스', '음식(계란·우유 등)', '기타'];

export const WARD_OPTIONS = [...WARDS.map(w => w.name), '외래', '응급실'];

export function bedOptions(ward: string): string[] {
  const w = WARDS.find(x => x.name === ward);
  if (!w) return [];
  const out: string[] = [];
  w.rooms.forEach((size, ri) => {
    for (let b = 1; b <= size; b++) out.push(bedLabel(w, ri + 1, b));
  });
  return out;
}

export const newPtNo = () => String(Math.floor(1000 + Math.random() * 9000));

// 진료과별 의료진 (가상 인물). 교수는 위 DOCTORS, 나머지는 과 코드로 만든다.
export type Staff = { name: string; dept: string; rank: '교수' | '전임의' | '레지던트' | '인턴'; ext: string };
const SUR = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황'];
const GIV = ['민준', '서연', '지후', '하윤', '도윤', '수아', '예준', '지우', '시우', '유진', '건우', '다은', '현우', '채원', '준서', '소율'];
const nm = (seed: number) => `${SUR[seed % SUR.length]}${GIV[(seed * 7 + 3) % GIV.length]}`;
export function staffOf(dept: string): Staff[] {
  const di = Math.max(0, DEPTS.findIndex(d => d.code === dept));
  const base = 3000 + di * 20;
  const prof = DOCTORS.filter(d => d.dept === dept).map((d, k): Staff => ({ name: d.name, dept, rank: '교수', ext: String(base + k) }));
  const rest: Staff[] = [
    { name: nm(di * 5 + 1), dept, rank: '전임의', ext: String(base + 5) },
    { name: nm(di * 5 + 2), dept, rank: '레지던트', ext: String(base + 6) },
  ];
  return [...prof, ...rest];
}

// ── 원내전화번호부 (가상 조직도) ──
export type DirPerson = { rank: string; name: string; ext: string; role?: string };
export type DirUnit = { name: string; ext: string; loc: string; people: DirPerson[] };
export type DirGroup = { name: string; units: DirUnit[] };
const WLOC = (f: number) => `본관 ${f}층`;
const support: [string, string, string, string][] = [
  ['응급실', '2119', '본관 1층', '응급'], ['중환자실', '2301', '본관 3층', '중환자'], ['수술실', '2410', '본관 4층', '수술'], ['마취통증의학과', '2415', '본관 4층', '마취'],
  ['영상의학과 (CT·MRI)', '2520', '별관 지하1층', '영상'], ['진단검사의학과', '2610', '별관 1층', '검사'], ['혈액은행', '2630', '별관 1층', '혈액'], ['내시경실', '2480', '본관 2층', '내시경'],
  ['재활의학과 (PT)', '2560', '별관 2층', '재활'], ['약제부', '2710', '본관 지하1층', '약제'], ['영양팀', '2750', '본관 지하1층', '영양'],
];
const admin: [string, string, string, string][] = [
  ['원무과 (입퇴원)', '2800', '본관 1층', '원무'], ['의무기록팀', '2820', '행정동 1층', '의무기록'], ['의료정보팀 (EMR)', '2910', '행정동 2층', '정보'], ['감염관리실', '2930', '본관 5층', '감염'],
  ['QPS (의료질관리)', '2950', '행정동 3층', '질관리'], ['교육수련팀', '2970', '행정동 3층', '교육'], ['시설관리팀', '2990', '행정동 지하1층', '시설'],
];
const pn = (seed: number, rank: string, ext: string, role?: string): DirPerson => ({ rank, name: nm(seed), ext, role });
export function buildDirectory(): DirGroup[] {
  const med: DirUnit[] = DEPTS.map((d, di) => ({ name: d.name, ext: String(3000 + di * 20 + 11), loc: di < 6 ? '본관 2층 외래' : '본관 3층 외래', people: staffOf(d.code).map(x => ({ rank: x.rank, name: x.name, ext: x.ext })) }));
  const nurse: DirUnit[] = WARDS.map((w, wi) => ({
    name: w.name, ext: String(4000 + wi * 10), loc: WLOC(w.floor),
    people: [pn(wi * 11 + 1, '수간호사', String(4000 + wi * 10 + 1), '병동 관리'), pn(wi * 11 + 2, '책임간호사', String(4000 + wi * 10 + 2), '1팀'), pn(wi * 11 + 3, '책임간호사', String(4000 + wi * 10 + 3), '2팀'), { rank: '간호사', name: '스테이션', ext: String(4000 + wi * 10), role: '대표번호' }],
  }));
  nurse.push({ name: '외래 간호팀', ext: '4300', loc: '본관 2층', people: [pn(201, '파트장', '4301'), { rank: '간호사', name: '스테이션', ext: '4300', role: '대표번호' }] });
  nurse.push({ name: '간호부', ext: '4001', loc: '행정동 2층', people: [pn(301, '간호부장', '4001'), pn(302, '간호팀장', '4002', '교육·QI')] });
  const mk = (rows: [string, string, string, string][], base: number): DirUnit[] => rows.map(([name, ext, loc, role], k) => ({ name, ext, loc, people: [pn(base + k * 3, '팀장', String(Number(ext) + 1), role), pn(base + k * 3 + 1, '담당', String(Number(ext) + 2), role)] }));
  return [{ name: '진료부', units: med }, { name: '간호부', units: nurse }, { name: '진료지원', units: mk(support, 400) }, { name: '행정·지원', units: mk(admin, 500) }];
}
