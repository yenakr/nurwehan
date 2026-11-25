import { KCD } from './kcd';
import { MAT_MASTER, ACT_MASTER } from './master';
// 가상 환자 실습용 코드표 (실제 병원 코드와 다를 수 있음)
const DX0: [string, string][] = [
  ['I10', '본태성 고혈압'], ['I50.0', '울혈심부전'], ['I50.9', '상세불명의 심부전'], ['I21.9', '급성 심근경색증'], ['I20.9', '협심증'], ['I48', '심방세동 및 조동'],
  ['I63.9', '뇌경색증'], ['I61.9', '뇌내출혈'], ['I82.9', '정맥 색전증 및 혈전증'],
  ['E11.9', '제2형 당뇨병'], ['E11.65', '고혈당을 동반한 제2형 당뇨병'], ['E10.9', '제1형 당뇨병'], ['E78.5', '상세불명의 고지혈증'], ['E87.1', '저나트륨혈증'], ['E87.6', '저칼륨혈증'], ['E86', '체액량 감소'],
  ['J18.9', '상세불명의 폐렴'], ['J44.1', '급성 악화를 동반한 만성 폐쇄성 폐질환'], ['J45.9', '천식'], ['J96.0', '급성 호흡부전'], ['J90', '흉막삼출'], ['J93.9', '기흉'],
  ['K35.8', '급성 충수염'], ['K80.2', '담석증'], ['K81.0', '급성 담낭염'], ['K29.7', '위염'], ['K25.9', '위궤양'], ['K56.6', '장폐색'], ['K74.6', '간경변증'], ['K85.9', '급성 췌장염'], ['K92.2', '위장관 출혈'],
  ['N39.0', '요로감염'], ['N18.9', '만성 신장병'], ['N17.9', '급성 신부전'], ['N20.0', '신장결석'],
  ['M17.9', '무릎 관절증'], ['M16.9', '고관절증'], ['M51.2', '추간판 전위'], ['M54.5', '요통'],
  ['S72.0', '대퇴골 경부 골절'], ['S52.5', '요골 원위부 골절'], ['S82.6', '외과 골절'], ['S06.9', '두개내 손상'],
  ['C16.9', '위의 악성 신생물'], ['C18.9', '결장의 악성 신생물'], ['C34.9', '기관지 및 폐의 악성 신생물'], ['C50.9', '유방의 악성 신생물'], ['C22.0', '간세포암종'],
  ['A09', '감염성 위장염 및 대장염'], ['A41.9', '패혈증'], ['L03.1', '사지 연조직염'], ['L89.9', '욕창성 궤양'],
  ['O80', '자연분만'], ['O82', '제왕절개 분만'], ['O14.1', '중증 전자간증'],
  ['F32.9', '우울 삽화'], ['F20.9', '조현병'], ['F10.3', '알코올 금단상태'],
  ['R07.4', '상세불명의 흉통'], ['R10.4', '복통'], ['R50.9', '발열'], ['R55', '실신'], ['D64.9', '빈혈'],
  ['S93.4', '발목 염좌'], ['K26.4', '출혈을 동반한 십이지장 궤양'], ['B98.0', '헬리코박터 파일로리 감염'], ['E11.4', '당뇨병성 신경병증을 동반한 제2형 당뇨병'], ['J10.1', '인플루엔자 (A형)'], ['I49.0', '심실세동'], ['I21.1', '급성 하벽 심근경색증'],
  ['J21.9', '급성 세기관지염'], ['J03.9', '급성 편도염'], ['B34.9', '바이러스 감염'],
];

// 간호행위(약속처방): [행위, 기본 재료(첫 번째)] — 전체 목록은 master.ts
export const ACTS: [string, string][] = ACT_MASTER.map(x => [x.name, x.mats[0]?.[0] || '']);
// 처치재료(간호fee): [품목, 단위]
export const MATS: [string, string][] = MAT_MASTER.map(x => [x.name, x.unit]);
export const MAT_INFO = new Map(MAT_MASTER.map(x => [x.name, x]));
export const actMats = (act: string): [string, number][] => ACT_MASTER.find(x => x.name === act)?.mats || [];

// 처방을 수행할 때 함께 쓰이는 기본 처치재료. [품목, 수량]
const has = (n: string, re: RegExp) => re.test(n);
export function matsFor(o: Record<string, string | undefined>): [string, number][] {
  const name = o.name || '';
  const route = (o.route || '').toUpperCase();
  if (has(name, /BST|blood glucose|혈당/i)) return [['혈당 검사지', 1], ['란셋', 1], ['알코올 솜', 1]];
  if (has(name, /N\/S|saline|D5|D10|hartmann|ringer|fluid|수액|\bHS\b|plasma/i) && route !== 'PO') return [['IV 수액 세트 (일반)', 1], ['알코올 솜', 1]];
  if (has(name, /transfusion|PRBC|수혈|FFP|platelet/i)) return [['수혈 세트', 1], ['알코올 솜', 1]];
  if (has(name, /foley|도뇨/i)) return [['Foley catheter 16Fr', 1], ['Urine bag (일반)', 1], ['일회용 도뇨 세트', 1]];
  if (has(name, /L-tube|경관/i)) return [['경관영양 세트', 1], ['경관영양 주입기 50mL', 1]];
  if (has(name, /dressing|드레싱|wound/i)) return [['드레싱 세트 (일반)', 1], ['멸균 거즈 (4x4)', 1]];
  if (has(name, /suction|흡인/i)) return [['흡인 카테터 12Fr', 1]];
  if (has(name, /neb|네뷸/i)) return [['네뷸라이저 세트', 1]];
  if (has(name, /O2|oxygen|산소/i)) return [['비강 캐뉼라 (성인)', 1]];
  if (has(name, /ECG|심전도/i)) return [['ECG 전극', 3]];
  if (has(name, /enema|관장/i)) return [['관장 세트', 1]];
  if (route === 'IV' || route === 'IM' || route === 'SC' || route === 'ID') return [[route === 'SC' ? '주사기 1mL' : '주사기 5mL', 1], ['알코올 솜', 1]];
  return [];
}

export const DIETS = ['일반식', '죽 (미음 포함)', '연식', '당뇨식', '저염식', '저지방식', '신장 질환식', '고단백식', '경관영양', '유동식', '금식 (NPO)', '검사식'];

export const FORMS2 = ['입원생활안내문', '낙상예방 안내문', '욕창예방 안내문', '비급여 동의서', '안전사고 동의서', '억제대 동의서', '수혈 동의서', '개인정보 동의서', '퇴원 안내문'];

export const RET_KINDS = ['DC 마약 반납', '마약 잔량 반납', 'DC 혈액 반납', 'DC 약 반납', '냉장약 반납'];

const HAVE = new Set(DX0.map(d => d[0]));
export const DX: [string, string][] = [...DX0, ...KCD.filter(d => !HAVE.has(d[0]))];

export const dxName = (code: string) => DX.find(d => d[0].toLowerCase() === code.trim().toLowerCase())?.[1];
export const dxCode = (name: string) => DX.find(d => d[1] === name.trim())?.[0];
