import type { Row, Sample } from './types';

// 가상 환자 예시 (실제 환자 정보 아님). 사례별 내용은 cases/ 폴더에 있다.
import { adult } from './cases/adult';
import { child } from './cases/child';
import { women } from './cases/women';
import { psych } from './cases/psych';
import { gi } from './cases/gi';
import { pul } from './cases/pul';
import { gs } from './cases/gs';
import { os } from './cases/os';
import { op1, op2 } from './cases/op';
import { er1, er2 } from './cases/er';
import { enrich } from './enrich';

export const SAMPLES: Sample[] = [adult, child, women, psych, gi, pul, gs, os, op1, op2, er1, er2].map(enrich);

export type Ward = { name: string; floor: number; dept: string; group: '내과' | '외과' | null; rooms: number[] };
const R = [4, 2, 2, 1, 2]; // 병실별 병상 수 (총 11병상)
export const WARDS: Ward[] = [
  { name: '41병동', floor: 4, dept: '산부인과', group: null, rooms: R },
  { name: '51병동', floor: 5, dept: '소아청소년과', group: null, rooms: R },
  { name: '61병동', floor: 6, dept: '순환기·호흡기내과', group: '내과', rooms: R },
  { name: '71병동', floor: 7, dept: '소화기·내분비내과', group: '내과', rooms: R },
  { name: '81병동', floor: 8, dept: '일반외과', group: '외과', rooms: R },
  { name: '91병동', floor: 9, dept: '정형외과·신경외과', group: '외과', rooms: R },
  { name: '101병동', floor: 10, dept: '정신건강의학과', group: null, rooms: R },
];
export const roomNo = (w: Ward, r: number) => w.floor * 100 + r; // r: 1부터
export const bedLabel = (w: Ward, r: number, b: number) => `${roomNo(w, r)}-${b}`;

export const VIEW_LIST: { name: string; label: string; group: string | null }[] = [
  ...WARDS.map(w => ({ name: w.name, label: `${w.name} ${w.dept}`, group: w.group })),
  { name: '외래', label: '외래', group: null },
  { name: '응급', label: '응급', group: null },
  { name: '퇴원', label: '퇴원 환자', group: null },
];
