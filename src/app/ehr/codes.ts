import { KCD } from './kcd';
import { MAT_MASTER, ACT_MASTER } from './master';
// 가상 환자 실습용 코드표 (실제 병원 코드와 다를 수 있음)
const DX0: [string, string][] = [
  ['I10', 'Essential (primary) hypertension'], ['I50.0', 'Heart failure'], ['I50.9', 'Heart failure, unspecified'], ['I21.9', 'Acute myocardial infarction, unspecified'], ['I20.9', 'Angina pectoris, unspecified'], ['I48', 'Atrial fibrillation and flutter'],
  ['I63.9', 'Cerebral infarction, unspecified'], ['I61.9', 'Nontraumatic intracerebral hemorrhage, unspecified'], ['I82.9', 'Embolism and thrombosis of unspecified vein'],
  ['E11.9', 'Type 2 diabetes mellitus without complications'], ['E11.65', 'Type 2 diabetes mellitus with hyperglycemia'], ['E10.9', 'Type 1 diabetes mellitus without complications'], ['E78.5', 'Hyperlipidemia, unspecified'], ['E87.1', 'Hypo-osmolality and hyponatremia'], ['E87.6', 'Hypokalemia'], ['E86', 'Volume depletion'],
  ['J18.9', 'Pneumonia, unspecified organism'], ['J44.1', 'Chronic obstructive pulmonary disease with (acute) exacerbation'], ['J45.9', 'Other and unspecified asthma'], ['J96.0', 'Acute respiratory failure'], ['J90', 'Pleural effusion, not elsewhere classified'], ['J93.9', 'Pneumothorax, unspecified'],
  ['K35.8', 'Other and unspecified acute appendicitis'], ['K80.2', 'Calculus of gallbladder without cholecystitis'], ['K81.0', 'Acute cholecystitis'], ['K29.7', 'Gastritis, unspecified'], ['K25.9', 'Gastric ulcer, unspecified as acute or chronic, without hemorrhage or perforation'], ['K56.6', 'Other and unspecified intestinal obstruction'], ['K74.6', 'Other and unspecified cirrhosis of liver'], ['K85.9', 'Acute pancreatitis, unspecified'], ['K92.2', 'Gastrointestinal hemorrhage, unspecified'],
  ['N39.0', 'Urinary tract infection, site not specified'], ['N18.9', 'Chronic kidney disease, unspecified'], ['N17.9', 'Acute kidney failure, unspecified'], ['N20.0', 'Calculus of kidney'],
  ['M17.9', 'Osteoarthritis of knee, unspecified'], ['M16.9', 'Osteoarthritis of hip, unspecified'], ['M51.2', 'Other thoracic, thoracolumbar and lumbosacral intervertebral disc displacement'], ['M54.5', 'Low back pain'],
  ['S72.0', 'Fracture of head and neck of femur'], ['S52.5', 'Fracture of lower end of radius'], ['S82.6', 'Fracture of lateral malleolus'], ['S06.9', 'Unspecified intracranial injury'],
  ['C16.9', 'Malignant neoplasm of stomach, unspecified'], ['C18.9', 'Malignant neoplasm of colon, unspecified'], ['C34.9', 'Malignant neoplasm of unspecified part of bronchus or lung'], ['C50.9', 'Malignant neoplasm of breast of unspecified site'], ['C22.0', 'Liver cell carcinoma'],
  ['A09', 'Infectious gastroenteritis and colitis, unspecified'], ['A41.9', 'Sepsis, unspecified organism'], ['L03.1', 'Cellulitis and acute lymphangitis of other parts of limb'], ['L89.9', 'Pressure ulcer of unspecified site'],
  ['O80', 'Encounter for full-term uncomplicated delivery'], ['O82', 'Encounter for cesarean delivery without indication'], ['O14.1', 'Severe pre-eclampsia'],
  ['F32.9', 'Major depressive disorder, single episode, unspecified'], ['F20.9', 'Schizophrenia, unspecified'], ['F10.3', 'Alcohol related disorders'],
  ['R07.4', 'Pain in throat and chest'], ['R10.4', 'Abdominal and pelvic pain'], ['R50.9', 'Fever, unspecified'], ['R55', 'Syncope and collapse'], ['D64.9', 'Anemia, unspecified'],
  ['S93.4', 'Sprain of ankle'], ['K26.4', 'Chronic or unspecified duodenal ulcer with hemorrhage'], ['B98.0', 'Helicobacter pylori [H. pylori] as the cause of diseases classified elsewhere'], ['E11.4', 'Type 2 diabetes mellitus with neurological complications'], ['J10.1', 'Influenza due to other identified influenza virus with other respiratory manifestations'], ['I49.0', 'Ventricular fibrillation and flutter'], ['I21.1', 'ST elevation (STEMI) myocardial infarction of inferior wall'],
  ['J21.9', 'Acute bronchiolitis, unspecified'], ['J03.9', 'Acute tonsillitis, unspecified'], ['B34.9', 'Viral infection, unspecified'],
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
