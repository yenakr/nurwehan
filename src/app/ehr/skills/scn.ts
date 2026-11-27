// 핵심술기 시나리오: 설정(cfg) → 가상 차트 · 상황 브리핑 · 기록 확인. 술기는 실제로 수행하고 EHR에는 그 결과를 기록한다.
// 채점은 교수가 직접 한다. 여기서는 EHR에 기록이 남았는지만 참고용으로 확인한다.
import { emptyChart, migrate, shiftChart, type ChartData } from '../types';
import { od, vit, sec, memo, full, dt, md } from '../cases/h';

export type Ord = { name: string; dose: string; unit: string; route: string; cnt: string; slots: string; prn: boolean; memo: string };
export type Cfg = {
  name: string; age: string; sex: 'M' | 'F'; dx: string; allergy: string; ward: string; bed: string; dept: string; doctor: string; cc: string;
  clock: string; // 시작 시각 (HH:MM)
  situation: string; vit: string; orders: Ord[]; checks: string[];
};
export type Item = { id: string; group: string; label: string; tip: string; ok: boolean; manual?: boolean; avoid?: boolean };
export type Tbl = { cap: string; head: string[]; rows: string[][] };
type Ev = 'note' | 'vital' | 'give' | 'io' | 'line' | 'cpr' | 'preop' | 'transf' | 'iv';
type Def = { key: string; title: string; goal: string; patient: Partial<Cfg>; situation: string; orders: Ord[]; checks: string[]; guide: string[]; ev: Ev[]; vit?: string; seed?: (d: ChartData) => void };

const o = (name: string, dose: string, unit: string, route: string, cnt = '', slots = '', memoTxt = '', prn = false): Ord => ({ name, dose, unit, route, cnt, slots, prn, memo: memoTxt });
const P = (name: string, age: string, sex: 'M' | 'F', dx: string, ward: string, bed: string, dept: string, doctor: string, cc: string, allergy = '무', clock = '09:00'): Partial<Cfg> => ({ name, age, sex, dx, ward, bed, dept, doctor, cc, allergy, clock });
const NOTE = '간호기록에 시간·수행 내용·환자 반응을 Focus 형식으로 남겨요.';
const WHO = '환자 이름·등록번호를 팔찌로 확인하고 처방을 확인해요.';

const DEFS: Def[] = [
  { key: 'vital', title: '활력징후 측정', goal: '체온·맥박·호흡·혈압·산소포화도를 직접 측정하고 EHR에 기록해요.', ev: ['vital', 'note'], vit: '118/72,84,18,37.2,97',
    patient: P('최민준', '55', 'M', 'Generalized peritonitis, POD#1', '81병동', '810-1', 'GS', '한외과', '복통', '무', '14:00'),
    situation: '수술 후 1일째 환자입니다. 14:00 정규 활력징후 측정 시간이에요. 실습 도구로 체온·맥박·호흡·혈압·산소포화도를 직접 측정하고, 측정한 값을 EHR 임상관찰에 기록하세요. 이상 소견이 있으면 간호기록에 남기고 보고하세요.',
    orders: [o('Acetaminophen 650mg (타이레놀)', '650', 'mg', 'PO', '0회/4회', '', '체온 38.0℃ 이상일 때', true)],
    checks: ['환자 확인(이름·등록번호)', '체온·맥박·호흡·혈압·SpO₂ 정확히 측정', '측정값 EHR 임상관찰에 기록', '이상 소견 판단·보고·간호기록'],
    guide: [WHO, '실습 도구로 활력징후를 직접 측정해요.', '측정한 값을 임상관찰(Flowsheet 또는 PDA 임상관찰)에 기록해요.', '이상 소견이 있으면 간호기록에 남기고 보고해요.'] },
  { key: 'oral', title: '경구투약', goal: '처방을 확인하고 경구약을 투약한 뒤 PDA로 수행을 기록해요.', ev: ['give', 'note'], vit: '132/80,76,18,36.7,97',
    patient: P('김영숙', '72', 'F', 'Essential hypertension, Type 2 diabetes mellitus', '61병동', '608-2', 'IM', '박내과', '어지러움', '무', '08:50'),
    situation: '09:00 투약 시간입니다. 처방과 환자를 확인하고 경구약을 직접 준비해 투약하세요. 투약은 PDA로 환자 팔찌와 약을 스캔해 기록하고, 투약 후 환자 반응을 간호기록에 남기세요.',
    orders: [o('Amlodipine 5mg (아모디핀)', '5', 'mg', 'PO', '1회', '09:00/'), o('Metformin 500mg (다이아벡스)', '500', 'mg', 'PO', '1회', '09:00/', '식후 투여')],
    checks: ['5Right 확인(환자·약·용량·경로·시간)', '손위생과 약 준비', '환자 팔찌·약 스캔(PDA)', '투약 방법 설명·삼키는 것 확인', '투약 후 기록'],
    guide: [WHO, '약을 5Right로 확인해 준비하고 환자에게 직접 투약해요.', 'PDA로 환자 팔찌 → 약 순서로 스캔해 수행 기록을 남겨요.', '간호기록에 투약 내용과 반응을 적어요.'] },
  { key: 'im', title: '근육주사', goal: '근육주사를 직접 수행하고 투약 기록을 남겨요.', ev: ['give', 'note'], vit: '128/78,80,18,36.8,98',
    patient: P('정수민', '45', 'M', 'Lumbar sprain', '71병동', '705-1', 'OS', '하정형', '요통', '무', '13:50'),
    situation: '14:00 근육주사 처방이 있습니다. 처방과 환자를 확인하고 주사 부위를 정해 근육주사를 직접 수행하세요. 투약은 PDA로 스캔해 기록하고, 주사 부위와 환자 반응을 간호기록에 남기세요.',
    orders: [o('Diclofenac 75mg/3mL (볼타렌주)', '75', 'mg', 'IM', '1회', '14:00/', '둔부 근육주사')],
    checks: ['5Right 확인', '주사 부위 선택·소독', '바늘 각도(90°)·흡인 여부', '주사 후 부위 관찰·압박', '투약 기록(PDA)'],
    guide: [WHO, '주사 부위를 정하고 근육주사를 수행해요.', 'PDA로 환자 팔찌 → 약 순서로 스캔해요.', '주사 부위와 환자 반응을 간호기록에 적어요.'] },
  { key: 'sc', title: '피하주사', goal: '피하주사를 직접 수행하고 투약 기록을 남겨요.', ev: ['give', 'note'], vit: '124/74,78,18,36.7,98',
    patient: P('강미란', '63', 'F', 'Total hip arthroplasty, POD#2', '91병동', '903-2', 'OS', '하정형', '고관절 통증', '무', '08:50'),
    situation: '09:00 피하주사 처방이 있습니다. 처방과 환자를 확인하고 주사 부위를 정해 피하주사를 직접 수행하세요. 투약은 PDA로 스캔해 기록하고, 주사 부위와 환자 반응을 간호기록에 남기세요.',
    orders: [o('Enoxaparin 40mg/0.4mL (크렉산)', '40', 'mg', 'SC', '1회', '09:00/', '복부 피하주사')],
    checks: ['5Right 확인', '주사 부위(복부) 선택·소독', '주사 후 문지르지 않기', '투약 기록(PDA)', '출혈·멍 관찰'],
    guide: [WHO, '주사 부위를 정하고 피하주사를 수행해요.', 'PDA로 환자 팔찌 → 약 순서로 스캔해요.', '주사 부위와 환자 반응을 간호기록에 적어요.'] },
  { key: 'id', title: '피내주사', goal: '피내주사(피부반응검사)를 수행하고 결과를 판독해 기록해요.', ev: ['give', 'note'], vit: '122/76,78,18,36.8,98',
    patient: P('오지훈', '34', 'M', 'Cellulitis, left lower leg', '51병동', '503-1', 'IM', '최내과', '다리 발적·열감', '무', '09:50'),
    situation: '10:00 항생제 투여 전 피부반응검사가 필요합니다. 처방을 확인하고 피내주사를 직접 수행하세요. 15분 뒤 반응을 판독해 결과를 간호기록에 남기고, 양성이면 의사에게 보고하세요.',
    orders: [o('Cefazolin skin test (피부반응검사)', '0.1', 'mL', 'ID', '1회', '10:00/', '15분 후 판독'), o('Cefazolin 1g/V (세파졸린)', '1', 'g', 'IV', '3회', '', '피부반응검사 음성일 때 투여')],
    checks: ['5Right·알레르기 확인', '전완 내측 소독 후 피내주사(팽진 형성)', '주사 부위 문지르지 않기·표시', '15분 후 판독', '판독 결과 기록·양성 시 보고'],
    guide: [WHO, '전완 내측에 피내주사를 수행해 팽진을 만들어요.', 'PDA로 스캔해 투약을 기록해요.', '15분 후 반응을 판독해 간호기록에 적어요.'] },
  { key: 'ivf', title: '정맥 수액 주입', goal: '수액을 연결해 주입 속도를 조절하고 기록해요.', ev: ['give', 'iv', 'note'], vit: '106/64,92,18,37.0,98',
    patient: P('한서윤', '58', 'F', 'Acute gastroenteritis with dehydration', '51병동', '507-1', 'IM', '최내과', '구토, 설사', '무', '10:50'),
    situation: '탈수가 있어 수액 처방이 있습니다. 처방과 환자를 확인하고 수액을 준비해 정맥 라인에 연결하세요. 처방 속도로 주입 속도를 조절하고, 주입 시작 내용과 주입 부위 관찰을 간호기록과 I/O에 남기세요.',
    orders: [o('0.9% NaCl 1000mL', '1000', 'mL', 'IV', '1회', '11:00/', '100mL/hr로 주입')],
    checks: ['처방 확인(수액 종류·양·속도)', '수액 준비와 무균법', '라인 연결·공기 제거', '주입 속도 조절(방울 수 계산)', '주입 부위 관찰·기록'],
    guide: [WHO, '수액을 준비해 라인에 연결하고 주입 속도를 맞춰요.', 'PDA로 스캔해 투약을 기록하고 I/O에 주입량을 남겨요.', '주입 부위 상태를 간호기록에 적어요.'] },
  { key: 'bt', title: '수혈요법', goal: '수혈 전 확인부터 수혈 중 관찰까지 기록해요.', ev: ['transf', 'vital', 'note'], vit: '104/62,96,20,36.8,97',
    patient: P('윤채원', '70', 'F', 'Iron deficiency anemia', '61병동', '610-1', 'IM', '박내과', '어지러움, 창백', '무', '10:00'),
    situation: '빈혈(Hb 6.8)로 pRBC 1 unit 수혈 처방이 있습니다. 혈액 수령 후 2인 확인(환자·혈액형·혈액번호)을 하고 수혈을 시작하세요. 수혈 전·시작 15분 후·수혈 중 활력징후를 측정해 EHR에 기록하고, 수혈 반응 관찰 내용을 간호기록에 남기세요.',
    orders: [o('pRBC 1 unit (농축적혈구)', '1', 'unit', 'IV', '1회', '10:30/', '2인 확인 후 수혈')],
    checks: ['수혈 동의서·혈액형 확인', '2인 확인(환자·혈액번호)', '수혈 전·후 활력징후', '시작 15분 천천히 관찰', '수혈 반응 관찰·기록'],
    seed: d => { d.labs = [{ name: 'Hb', value: '6.8', unit: 'g/dL', min: '12', max: '16', sample: 'Blood', time: md(0, '06:00') }]; },
    guide: [WHO, '혈액 수령 후 2인 확인을 하고 수혈을 시작해요.', '수혈 전·시작 15분 후·중간 활력징후를 임상관찰에 기록해요.', '수혈 반응 관찰 내용을 간호기록에 적어요.'] },
  { key: 'ng', title: '간헐적 위관영양', goal: '위관 위치 확인 후 경관영양을 주입하고 기록해요.', ev: ['io', 'note'], vit: '128/76,74,18,36.6,97',
    patient: P('이정식', '81', 'M', 'Cerebral infarction (L-tube feeding)', '91병동', '905-2', 'NS', '정신경', '좌측 편마비', '무', '11:50'),
    situation: '12:00 위관영양 시간입니다. 처방과 환자를 확인하고 L-tube 위치와 잔여량을 확인한 뒤 경관영양을 주입하세요. 상체를 높인 자세로 시행하고, 주입량과 환자 반응을 I/O와 간호기록에 남기세요.',
    orders: [o('Enteral nutrition (Nutren 1.0) 200mL', '200', 'mL', 'L-tube', '1일 4회', '12:00/', '주입 후 30분 상체 거상')],
    checks: ['처방·환자 확인', '관 위치·잔여량 확인', '상체 30~45° 거상', '영양액 온도·주입 속도', '주입 후 물 주입·관 관리', 'I/O 기록'],
    guide: [WHO, 'L-tube 위치와 잔여량을 확인하고 경관영양을 주입해요.', '주입량을 I/O에 기록해요.', '환자 반응을 간호기록에 적어요.'] },
  { key: 'cath', title: '단순도뇨', goal: '1회 도뇨를 수행하고 소변량·양상을 기록해요.', ev: ['io', 'note'], vit: '126/78,82,18,36.9,98',
    patient: P('임수아', '66', 'F', 'Postoperative urinary retention', '81병동', '806-1', 'GS', '한외과', '배뇨 곤란, 하복부 불편', '무', '15:50'),
    situation: '수술 후 자연배뇨가 되지 않고 하복부가 팽만합니다. 의사 처방에 따라 단순도뇨를 수행하세요. 무균법으로 도뇨하고, 소변량·색·양상을 I/O와 간호기록에 남기세요.',
    orders: [o('Intermittent catheterization (단순도뇨) 14Fr', '', '', '', '1회', '16:00/', '소변량 기록')],
    checks: ['처방·환자 확인, 설명과 프라이버시', '무균법(멸균 장갑·소독)', '요도 삽입 길이·소변 배출 확인', '소변량·양상 관찰', '도뇨 후 I/O·간호기록'],
    guide: [WHO, '환자에게 설명하고 무균법으로 도뇨해요.', '소변량을 I/O에 기록해요.', '소변 양상과 환자 반응을 간호기록에 적어요.'] },
  { key: 'foley', title: '유치도뇨', goal: '유치도뇨관을 삽입·고정하고 관리 내용을 기록해요.', ev: ['line', 'io', 'note'], vit: '134/82,80,18,36.8,97',
    patient: P('배준호', '72', 'M', 'Benign prostatic hyperplasia with urinary retention', '71병동', '709-1', 'UR', '오비뇨', '배뇨 곤란', '무', '15:50'),
    situation: '급성 요저류로 유치도뇨 처방이 있습니다. 처방과 환자를 확인하고 무균법으로 유치도뇨관을 삽입해 고정하세요. 삽입 후 소변량·양상, 풍선 용량, 고정 상태를 간호기록과 I/O에 남기세요.',
    orders: [o('Foley catheter insertion (유치도뇨) 16Fr', '', '', '', '1회', '16:00/', '삽입 후 소변 배출 확인')],
    checks: ['처방·환자 확인, 설명', '무균법·요도 소독', '삽입·풍선 팽창(용량)', '관 고정·소변주머니 위치', '소변량·양상·관 삽입 기록'],
    guide: [WHO, '무균법으로 유치도뇨관을 삽입하고 고정해요.', '삽입 정보를 라인 기록에, 소변량을 I/O에 남겨요.', '환자 반응과 관 상태를 간호기록에 적어요.'] },
  { key: 'enema', title: '배출관장', goal: '배출관장을 수행하고 배변 양상을 기록해요.', ev: ['note'], vit: '122/74,76,18,36.7,98',
    patient: P('서민재', '60', 'M', 'Constipation', '51병동', '510-2', 'GS', '한외과', '변비, 복부 팽만', '무', '15:50'),
    situation: '3일째 배변이 없어 배출관장 처방이 있습니다. 처방과 환자를 확인하고 좌측위로 배출관장을 수행하세요. 관장액을 주입한 뒤 참는 시간을 안내하고, 배변 양상과 환자 반응을 간호기록에 남기세요.',
    orders: [o('Glycerin enema 120mL (관장)', '120', 'mL', '직장', '1회', '16:00/', '좌측위 시행')],
    checks: ['처방·환자 확인, 설명·프라이버시', '좌측위·관장액 온도', '삽입 길이·천천히 주입', '배변 참는 시간 안내', '배변 양상·반응 기록'],
    guide: [WHO, '좌측위로 관장액을 천천히 주입해요.', '배변 양상과 환자 반응을 간호기록에 적어요.'] },
  { key: 'preop', title: '수술 전 간호', goal: '수술 전 준비를 확인하고 기록해요.', ev: ['preop', 'vital', 'note'], vit: '124/76,76,18,36.7,98',
    patient: P('조은비', '52', 'F', 'Acute cholecystitis, Lap. cholecystectomy 예정', '81병동', '802-1', 'GS', '한외과', '우상복부 통증', '무', '20:00'),
    situation: '내일 08:00 복강경 담낭절제술이 예정되어 있습니다. 수술 전 간호를 수행하세요. 수술 동의서·금식·피부 준비·장신구 제거·수술 전 투약 등을 확인하고 활력징후를 측정해 EHR(수술 전 확인서, 임상관찰)에 기록하고, 간호기록에 남기세요.',
    orders: [o('NPO after midnight', '', '', '', '', '', '')],
    seed: d => { d.surgery = [{ date: dt(1), dept: 'GS', name: 'Laparoscopic cholecystectomy', anes: '전신마취', note: '내일 08:00 예정' }]; },
    checks: ['수술 동의서·마취 동의서 확인', 'NPO 확인', '피부 준비·장신구·틀니 제거', '수술 전 활력징후', '수술 전 확인서 기록·환자 교육'],
    guide: [WHO, '수술 전 준비 항목을 확인하고 수술 전 확인서에 기록해요.', '활력징후를 측정해 임상관찰에 기록해요.', '교육 내용과 환자 상태를 간호기록에 적어요.'] },
  { key: 'postop', title: '수술 후 간호', goal: '수술 직후 환자를 사정하고 기록해요.', ev: ['vital', 'io', 'note'], vit: '',
    patient: P('신태양', '48', 'M', 'Acute appendicitis, s/p Laparoscopic appendectomy (POD#0)', '81병동', '812-1', 'GS', '한외과', '수술 후 관리', '무', '15:00'),
    situation: '복강경 충수절제술을 마치고 회복실에서 병동으로 도착했습니다. 수술 후 간호를 수행하세요. 활력징후·의식·통증·수술 부위 드레싱·소변량·배액(있다면)을 사정해 EHR에 기록하고, 환자 상태와 시행한 간호를 간호기록에 남기세요.',
    orders: [o('Ketorolac 30mg/A (케토락)', '30', 'mg', 'IV', '0회/3회', '', '통증 NRS 5 이상일 때', true)],
    checks: ['환자 확인·인계 내용 확인', '활력징후·의식 사정', '통증 평가', '수술 부위·드레싱·배액 확인', '소변량·I/O 기록', '간호기록'],
    guide: [WHO, '활력징후·의식·통증·수술 부위를 사정해요.', '사정 결과를 임상관찰·I/O에 기록해요.', '환자 상태와 시행한 간호를 간호기록에 적어요.'] },
  { key: 'admit', title: '입원 관리하기', goal: '신규 입원 환자를 맞아 기본 사정과 기록을 해요.', ev: ['vital', 'note'], vit: '',
    patient: P('문지안', '77', 'F', 'Community-acquired pneumonia', '61병동', '611-1', 'PUL', '최호흡', '기침, 발열', '무', '16:00'),
    situation: '응급실을 거쳐 61병동으로 신규 입원한 환자입니다. 환자와 보호자를 맞아 병실·병동 안내를 하고, 입원 시 활력징후를 측정하세요. 알레르기·복용 약·낙상 위험 등을 사정해 EHR에 기록하고, 입원 간호기록을 남기세요.',
    orders: [o('0.9% NaCl 500mL', '500', 'mL', 'IV', '1회', '', '입원 후 시작')],
    checks: ['환자 확인·팔찌 부착', '병실·병동 안내(호출벨·화장실 등)', '입원 시 활력징후', '알레르기·복용 약·낙상위험 사정', '입원 간호기록'],
    guide: [WHO, '병동 안내를 하고 활력징후를 측정해요.', '사정 내용을 EHR에 기록해요.', '입원 간호기록을 남겨요.'] },
  { key: 'iso', title: '격리실 출입 시 보호 장구 및 폐기물 관리', goal: '격리 환자 간호 시 보호 장구 착·탈의와 폐기물 처리를 수행하고 기록해요.', ev: ['note'], vit: '128/76,80,18,36.9,97',
    patient: P('김하늘', '71', 'M', 'MRSA infection (접촉주의 격리)', '51병동', '501-1', 'IM', '최내과', '상처 감염', '무', '09:50'),
    situation: '접촉주의 격리 중인 환자입니다. 격리실에 들어가기 전 보호 장구를 올바른 순서로 착용하고, 간호를 수행한 뒤 보호 장구를 벗고 폐기물을 분리배출하세요. 격리 간호 내용을 간호기록에 남기세요.',
    orders: [o('Contact isolation (접촉주의 격리)', '', '', '', '', '', '')],
    checks: ['손위생(출입 전·후)', '보호 장구 착용 순서', '보호 장구 탈의 순서', '폐기물 분리배출', '격리 간호기록'],
    guide: [WHO, '보호 장구를 착용하고 격리 환자를 간호해요.', '보호 장구를 벗고 폐기물을 분리배출해요.', '격리 간호 내용을 간호기록에 적어요.'] },
  { key: 'spo2', title: '산소포화도 측정과 심전도 모니터 적용', goal: '산소포화도와 심전도 모니터를 적용하고 결과를 기록해요.', ev: ['vital', 'note'], vit: '',
    patient: P('정우진', '66', 'M', 'Chest pain, rule out acute coronary syndrome', '61병동', '603-1', 'CV', '이심장', '흉통', '무', '10:00'),
    situation: '흉통으로 입원한 환자입니다. 심전도 모니터와 산소포화도 측정기를 적용하세요. 전극과 센서를 올바른 위치에 부착하고 기기가 작동하는지 확인한 뒤, 맥박·산소포화도와 리듬을 EHR 임상관찰에 기록하고 간호기록에 남기세요.',
    orders: [o('ECG monitoring (심전도 모니터링)', '', '', '', '', '', ''), o('SpO2 monitoring', '', '', '', '', '', '')],
    checks: ['환자 확인·설명', '전극 부착 위치(피부 준비)', '산소포화도 센서 적용', '기기 작동·알람 확인', '측정값(리듬·맥박·SpO₂) 기록'],
    guide: [WHO, '전극과 센서를 적용하고 기기가 작동하는지 확인해요.', '맥박·SpO₂를 임상관찰에 기록해요.', '리듬과 환자 상태를 간호기록에 적어요.'] },
  { key: 'o2', title: '비강 캐뉼라를 이용한 산소요법', goal: '비강 캐뉼라로 산소를 공급하고 반응을 기록해요.', ev: ['vital', 'note'], vit: '138/82,96,24,36.9,89',
    patient: P('한상철', '74', 'M', 'COPD acute exacerbation', '61병동', '607-2', 'PUL', '최호흡', '호흡곤란', '무', '10:00'),
    situation: '호흡곤란이 있고 산소포화도가 낮은 환자입니다. 처방에 따라 비강 캐뉼라로 산소를 적용하세요. 유량을 처방대로 맞추고 가습·고정 상태를 확인한 뒤, 산소 적용 후 산소포화도와 호흡 상태를 EHR에 기록하고 간호기록에 남기세요.',
    orders: [o('O2 2L/min via nasal cannula', '2', 'L/min', '비강', '', '', 'SpO2 90% 이상 유지')],
    checks: ['처방·환자 확인', '유량 설정·가습', '캐뉼라 올바른 적용·고정', '적용 후 SpO₂·호흡 재사정', '산소 적용 기록'],
    guide: [WHO, '처방 유량으로 비강 캐뉼라를 적용해요.', '적용 후 SpO₂를 임상관찰에 기록해요.', '호흡 상태와 환자 반응을 간호기록에 적어요.'] },
  { key: 'suction', title: '기관내 흡인', goal: '기관내 흡인을 무균법으로 수행하고 가래 양상을 기록해요.', ev: ['vital', 'note'], vit: '130/78,98,26,37.2,92',
    patient: P('강도현', '79', 'M', 'Aspiration pneumonia (ETT intubation)', '61병동', '612-1', 'PUL', '최호흡', '가래, 호흡음 거칠음', '무', '14:00'),
    situation: '기관내 삽관 상태에서 가래 끓는 소리가 들리고 산소포화도가 떨어졌습니다. 흡인 전 산소를 공급하고 멸균 흡인 카테터로 기관내 흡인을 수행하세요. 흡인 전·후 호흡음과 SpO₂를 확인하고, 가래의 양·색·점도를 간호기록에 남기세요.',
    orders: [o('Endotracheal suction (기관내 흡인)', '', '', '', 'PRN', '', '가래 끓는 소리·SpO2 저하 시', true)],
    checks: ['손위생·멸균 장갑·무균법', '흡인 전 산소 공급', '카테터 삽입 길이·흡인 시간(10~15초)', '흡인 전·후 호흡음·SpO₂ 사정', '가래 양상 기록'],
    guide: [WHO, '흡인 전 산소를 공급하고 무균법으로 흡인해요.', '흡인 전·후 SpO₂를 임상관찰에 기록해요.', '가래 양상과 환자 반응을 간호기록에 적어요.'] },
  { key: 'trach', title: '기관절개관 관리', goal: '기관절개관 소독과 내관 관리를 수행하고 기록해요.', ev: ['note'], vit: '126/76,84,20,36.8,96',
    patient: P('윤재석', '68', 'M', 'Tracheostomy state (Cerebral hemorrhage)', '91병동', '910-1', 'NS', '정신경', '기관절개관 관리', '무', '10:00'),
    situation: '기관절개관을 가진 환자입니다. 필요한 물품을 준비하고 기관절개관 소독과 내관 청소를 수행하세요. 절개 부위 피부, 분비물 양상, 고정 끈 상태를 관찰하고 시행한 간호를 간호기록에 남기세요.',
    orders: [o('Tracheostomy care q [8] hrs', '', '', '', '', '', '')],
    checks: ['손위생·무균 물품 준비', '내관 분리·청소·재삽입', '절개 부위 소독', '고정 끈 확인', '분비물·피부 관찰·기록'],
    guide: [WHO, '내관을 청소하고 절개 부위를 소독해요.', '피부·분비물·고정 상태를 관찰해요.', '시행한 간호와 관찰 내용을 간호기록에 적어요.'] },
  { key: 'cpr', title: '기본 심폐소생술 및 제세동기 적용', goal: '심정지 환자에게 CPR과 제세동기를 적용하고 기록해요.', ev: ['cpr', 'note'], vit: '',
    patient: P('한동수', '59', 'M', 'Acute myocardial infarction', '61병동', '605-1', 'CV', '이심장', '흉통', '무', '03:00'),
    situation: '병실 순회 중 환자가 반응이 없고 호흡이 없는 것을 발견했습니다. 반응 확인, 도움 요청, 호흡·맥박 확인 후 가슴 압박을 시작하고 제세동기를 적용하세요. 소생술 시각과 시행 내용을 EHR 심폐소생술 기록과 간호기록에 남기세요.',
    orders: [o('Full code (심폐소생술 시행)', '', '', '', '', '', '')],
    checks: ['반응·호흡 확인, 도움 요청', '가슴 압박(위치·깊이·속도)', '제세동기 패드 부착·리듬 분석', '제세동 시 안전 확인', '소생술 시각·내용 기록'],
    guide: [WHO, '반응을 확인하고 도움을 요청해요. 가슴 압박과 제세동기를 적용해요.', '소생술 시각과 시행 내용을 EHR 심폐소생술 기록에 남겨요.', '상황과 시행한 처치를 간호기록에 적어요.'] },
];

export const SKILLS: { key: string; title: string; goal: string }[] = DEFS.map(d => ({ key: d.key, title: d.title, goal: d.goal }));
const defOf = (skill: string) => DEFS.find(d => d.key === skill);
export const guideOf = (skill: string) => defOf(skill)?.guide || [];
export const hasGive = (skill: string) => !!defOf(skill)?.ev.includes('give');

export const defaultCfg = (skill: string): Cfg => {
  const d = defOf(skill) || DEFS[0];
  const p = d.patient;
  return JSON.parse(JSON.stringify({
    name: p.name, age: p.age, sex: p.sex, dx: p.dx, allergy: p.allergy, ward: p.ward, bed: p.bed, dept: p.dept, doctor: p.doctor, cc: p.cc, clock: p.clock,
    situation: d.situation, vit: d.vit || '', orders: d.orders, checks: d.checks,
  })) as Cfg;
};

// ---- 무작위 변형 (학생마다 다른 환자) ----
const NAMES = ['김하늘', '정우진', '한서윤', '오지훈', '윤채원', '강도현', '임수아', '배준호', '서민재', '조은비', '신태양', '문지안'];
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; };
}
export function vary(cfg: Cfg, skill: string, seed: string): Cfg {
  void skill;
  const r = rng(seed);
  const n = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const c: Cfg = JSON.parse(JSON.stringify(cfg));
  c.name = NAMES[Math.floor(r() * NAMES.length)]; c.age = String(Math.max(1, Number(c.age) + n(-4, 4)));
  c.bed = `${c.bed.split('-')[0].slice(0, 1)}${String(n(1, 12)).padStart(2, '0')}-${n(1, 4)}`;
  return c;
}

// ---- 차트 ----
const clockOf = (hm: string, back: number) => { const [h, m] = hm.split(':').map(Number); const t = (((h * 60 + m - back) % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
export function buildChart(skill: string, cfg: Cfg): { title: string; data: ChartData } | null {
  const def = defOf(skill);
  if (!def) return null;
  const d = emptyChart();
  d.info = {
    mode: 'skill', skill, sampleKey: `sk:${skill}`, skCfg: JSON.stringify(cfg), dept: cfg.dept, doctor: cfg.doctor, cc: cfg.cc, orderDate: dt(0), admit: dt(-2),
    height: '165', weight: '60', iso: '', npo: '0', surg: '0', lang: '한국어',
    ptNo: String(9100 + Math.floor(Math.random() * 800)), name: cfg.name, ageSex: `${cfg.age}/${cfg.sex}`, ward: cfg.ward, bed: cfg.bed, allergy: cfg.allergy, dx: cfg.dx,
    vbase: full(0, cfg.clock), slotDay: dt(0), dataVer: 'sk3',
  };
  const inj = /IV|IM|SC|ID|주사|수액/i, po = /PO|경구/i;
  const groups: [string, (x: Ord) => boolean][] = [['▶ 주사약 ◀', x => inj.test(x.route)], ['▶ 먹는약 ◀', x => po.test(x.route) && !inj.test(x.route)], ['▶ 기타 ◀', x => !inj.test(x.route) && !po.test(x.route)]];
  const orders = [sec('▶ 기본처방 ◀'), od('Check V/S q [4] hrs', '', '', '', '', '', [], '1'), od('Check I/O q [8] hrs', '', '', '', '', '', [], '1')];
  groups.forEach(([label, f]) => {
    const list = cfg.orders.filter(x => x.name.trim() && f(x));
    if (!list.length) return;
    orders.push(sec(label));
    list.forEach(x => {
      orders.push(od(x.name, x.dose, x.unit, x.cnt, x.route, x.prn ? '' : '집계완료', x.slots ? x.slots.split(',').map(s => s.trim()).filter(Boolean) : [], '1', x.prn ? 'PRN' : ''));
      if (x.memo.trim()) orders.push(memo(`※ ${x.memo.trim()}`));
    });
  });
  d.orders = orders;
  const m = cfg.vit.split(',').map(s => s.trim());
  if (m.length === 5 && m.every(Boolean)) d.vitals = [vit(full(0, clockOf(cfg.clock, 240)), m[0], m[1], m[2], m[3], m[4])];
  def.seed?.(d);
  return { title: `[술기] ${def.title} · ${cfg.name}`, data: shiftChart(migrate(d)) };
}

// ---- 상황 브리핑 ----
export function briefOf(skill: string, cfg: Cfg): Tbl[] {
  void skill;
  return [
    { cap: '환자', head: ['항목', '내용'], rows: [['진단', cfg.dx], ['알레르기', cfg.allergy], ['주호소', cfg.cc], ['시작 시각', cfg.clock]] },
    { cap: '상황', head: ['내용'], rows: [[cfg.situation]] },
  ];
}

// ---- 기록 확인 (참고용 · 채점은 교수가 직접) ----
const userNotes = (d: ChartData) => d.notes.filter(n => !/\(PDA/.test(n.text || ''));
const gaveAny = (d: ChartData) => d.pda.some(e => e.type === 'give') || d.orders.some(r => Object.keys(r).some(k => /^t\d+$/.test(k) && /\/\S+/.test(r[k] || '')));
const EVL: Record<Ev, [string, string, (d: ChartData, seeded: number) => boolean]> = {
  note: ['간호기록 작성', NOTE, d => userNotes(d).length > 0],
  vital: ['임상관찰(활력징후) 기록', '임상관찰에 측정값을 기록해요.', (d, s) => d.vitals.length > s],
  give: ['투약 수행 기록 (PDA 스캔)', 'PDA로 환자 팔찌 → 약을 스캔해 투약해요.', d => gaveAny(d)],
  io: ['I/O 기록', 'I/O에 양을 기록해요.', d => d.io.length > 0],
  line: ['튜브·라인 기록', '라인 기록에 삽입 정보를 남겨요.', d => d.lines.length > 0],
  cpr: ['심폐소생술 기록', 'EHR 심폐소생술 기록에 시각과 내용을 남겨요.', d => d.cpr.length > 0],
  preop: ['수술 전 확인서 작성', '수술 전 확인서(평가도구)를 작성해요.', d => (d.forms?.preop || []).length > 0],
  transf: ['수혈 기록', '수혈 기록에 시작·종료와 관찰을 남겨요.', d => d.transfusion.length > 0],
  iv: ['IV 수액 기록', 'IV 기록에 수액 주입 정보를 남겨요.', d => d.iv.length > 0],
};
export function gradeChart(skill: string, cfg: Cfg, d: ChartData): Item[] {
  const def = defOf(skill);
  if (!def) return [];
  const seeded = cfg.vit.split(',').filter(x => x.trim()).length === 5 ? 1 : 0;
  const ev: Item[] = def.ev.map(k => ({ id: `e_${k}`, group: 'EHR 기록', label: EVL[k][0], tip: EVL[k][1], ok: EVL[k][2](d, seeded) }));
  const manual: Item[] = cfg.checks.map((c, i) => ({ id: `m${i}`, group: '평가 항목 (교수 확인)', label: c, tip: '', ok: false, manual: true }));
  return [...ev, ...manual];
}

export const cfgOf = (info: Record<string, string>): Cfg | null => { try { return info.skCfg ? (JSON.parse(info.skCfg) as Cfg) : null; } catch { return null; } };

// 서버가 받은 설정을 믿지 않고 모양과 범위를 다시 맞춘다
export function cleanCfg(raw: unknown, skill: string): Cfg {
  const base = defaultCfg(skill);
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, d: string, max = 80) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : d);
  const free = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const num = (v: unknown, d: string) => ((typeof v === 'string' || typeof v === 'number') && /^\d{1,3}$/.test(String(v).trim()) ? String(v).trim() : d);
  const ords = Array.isArray(r.orders) ? (r.orders as unknown[]).slice(0, 12).map(x => {
    const q = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    return { name: free(q.name, 100), dose: free(q.dose, 12), unit: free(q.unit, 10), route: free(q.route, 10), cnt: free(q.cnt, 12), slots: free(q.slots, 60), prn: q.prn === true, memo: free(q.memo, 100) };
  }).filter(x => x.name) : base.orders;
  const checks = Array.isArray(r.checks) ? (r.checks as unknown[]).map(x => free(x, 120)).filter(Boolean).slice(0, 12) : base.checks;
  const vitOk = typeof r.vit === 'string' && (r.vit.trim() === '' || /^[\d./]+,[\d.]+,[\d.]+,[\d.]+,[\d.]+$/.test(r.vit.replace(/\s/g, '')));
  return {
    name: str(r.name, base.name, 20), age: num(r.age, base.age), sex: r.sex === 'M' ? 'M' : r.sex === 'F' ? 'F' : base.sex, dx: str(r.dx, base.dx, 100), allergy: str(r.allergy, base.allergy, 60),
    ward: str(r.ward, base.ward, 12), bed: str(r.bed, base.bed, 10), dept: str(r.dept, base.dept, 8), doctor: str(r.doctor, base.doctor, 12), cc: str(r.cc, base.cc, 60),
    clock: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(r.clock)) ? String(r.clock) : base.clock,
    situation: str(r.situation, base.situation, 800), vit: vitOk ? String(r.vit).replace(/\s/g, '') : base.vit, orders: ords, checks,
  };
}
