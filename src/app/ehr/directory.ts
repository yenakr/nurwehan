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

export const newPtNo = () => String(Math.floor(10000000 + Math.random() * 89999999));
