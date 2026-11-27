// 핵심술기별 EHR: 가상 환자 시나리오와 채점 기준 (전부 가상 정보)
export type Quiz = { id: string; q: string; multi: boolean; opts: { id: string; t: string }[]; ans: string[]; why: string };
export type Rule = { id: string; label: string; tip: string; test: RegExp[] };
export type Field = { id: string; label: string; opts?: string[]; ans: string; unit?: string; why?: string };
export type Table = { head: string[]; rows: string[][] };
export type Step =
  | { t: 'info'; title: string; lead?: string; tables: { cap: string; table: Table }[] }
  | { t: 'quiz'; title: string; quizzes: Quiz[] }
  | { t: 'scan'; title: string; lead: string; meds: { id: string; t: string }[]; good: string; why: string }
  | { t: 'form'; title: string; lead: string; fields: Field[] }
  | { t: 'note'; title: string; lead: string; focus: string; rules: Rule[] };
export type Scenario = {
  key: string; title: string; sub: string; goal: string;
  patient: { name: string; line: string; dx: string; allergy: string };
  steps: Step[];
};
const has = (...r: RegExp[]) => r;

const GIVE: Scenario = {
  key: 'med', title: '투약', sub: '오더 확인 → 5 Right → 바코드 스캔 → 간호기록', goal: '투약 전 오더·환자 상태를 확인해 줄 약과 보류할 약을 가려내고, 스캔 순서를 지켜 투약한 뒤 기록한다.',
  patient: { name: '박서연', line: 'F/67 · 3병동 12호 1', dx: '폐렴', allergy: '페니실린(전신 발진)' },
  steps: [
    { t: 'info', title: '1. 투약 전 오더·상태 확인', lead: '09:00 투약 시간입니다. 오더와 투약 직전 활력징후를 확인하세요.', tables: [
      { cap: '활성 처방 (09:00)', table: { head: ['약품', '용량', '경로', '비고'], rows: [
        ['푸로세미드(Furosemide)', '20mg', 'IV', '1일 1회 09:00'],
        ['암로디핀(Amlodipine)', '5mg', 'PO', '09:00 · SBP 100 미만 시 보류 후 보고'],
        ['아목시실린/클라불란산', '1.2g', 'IV', '8시간마다 09:00'],
        ['아세트아미노펜', '500mg', 'PO', 'PRN · 체온 38.0℃ 이상일 때'],
      ] } },
      { cap: '투약 직전 활력징후 (08:50)', table: { head: ['BP', 'HR', 'RR', 'BT', 'SpO₂'], rows: [['96/58', '88', '18', '36.8', '96%']] } },
      { cap: '환자 정보', table: { head: ['항목', '내용'], rows: [['알레르기', '페니실린 (전신 발진)'], ['진단', '폐렴']] } },
    ] },
    { t: 'quiz', title: '2. 사전 판단', quizzes: [
      { id: 'q1', q: '지금 그대로 투약해도 되는 약은?', multi: true, opts: [{ id: 'a', t: '푸로세미드 20mg IV' }, { id: 'b', t: '암로디핀 5mg PO' }, { id: 'c', t: '아목시실린/클라불란산 1.2g IV' }, { id: 'd', t: '아세트아미노펜 500mg PO' }], ans: ['a'], why: '암로디핀은 SBP 96으로 보류 조건, 아목시실린은 페니실린 알레르기, 아세트아미노펜은 체온 36.8℃라 PRN 조건에 해당하지 않습니다.' },
      { id: 'q2', q: '보류하고 의사에게 보고해야 하는 약은?', multi: true, opts: [{ id: 'a', t: '푸로세미드 20mg IV' }, { id: 'b', t: '암로디핀 5mg PO' }, { id: 'c', t: '아목시실린/클라불란산 1.2g IV' }, { id: 'd', t: '아세트아미노펜 500mg PO' }], ans: ['b', 'c'], why: '아세트아미노펜은 조건 미충족이라 "주지 않는 것"이고 보고 대상은 아닙니다. 보류 사유(SBP 96 / 페니실린 알레르기)가 있는 두 약만 보고합니다.' },
    ] },
    { t: 'scan', title: '3. PDA 스캔·투약', lead: '환자 팔찌 → 약 라벨 순서로 스캔한 뒤 투약하세요.', meds: [{ id: 'a', t: '푸로세미드 20mg IV' }, { id: 'b', t: '암로디핀 5mg PO' }, { id: 'c', t: '아목시실린/클라불란산 1.2g IV' }, { id: 'd', t: '아세트아미노펜 500mg PO' }], good: 'a', why: '환자 확인을 먼저 하고, 줄 수 있는 약(푸로세미드)만 스캔해 투약합니다.' },
    { t: 'quiz', title: '4. 투약 후 확인', quizzes: [
      { id: 'q3', q: '푸로세미드 투약 후 관찰·확인할 것을 모두 고르세요.', multi: true, opts: [{ id: 'a', t: '소변량(I/O)' }, { id: 'b', t: '혈압·맥박, 어지러움' }, { id: 'c', t: '전해질(특히 K) 결과' }, { id: 'd', t: '혈당 재측정' }, { id: 'e', t: '체온 재측정' }], ans: ['a', 'b', 'c'], why: '이뇨제는 소변량, 저혈압·기립성 어지러움, 저칼륨혈증을 확인합니다.' },
    ] },
    { t: 'note', title: '5. 간호기록', lead: '09:00 투약 상황을 기록하세요. 줄 약과 보류한 약, 보고까지 포함합니다.', focus: '투약', rules: [
      { id: 'time', label: '시간 (HH:MM)', tip: '투약·보고 시각을 적습니다.', test: has(/\d{1,2}\s*:\s*\d{2}|\d{1,2}시/) },
      { id: 'id', label: '환자 확인(팔찌·바코드 스캔)', tip: '환자 팔찌/바코드로 확인한 것을 남깁니다.', test: has(/팔찌|바코드|스캔|등록번호|환자\s*확인|이름/) },
      { id: 'drug', label: '투약한 약·용량·경로', tip: '푸로세미드 20mg IV처럼 약명·용량·경로.', test: has(/푸로세미드|furosemide|lasix/i, /20\s*mg/i, /IV|정맥/i) },
      { id: 'bp', label: '투약 전 혈압 수치', tip: '혈압 96/58 같은 수치를 적습니다.', test: has(/96\s*\/\s*58/) },
      { id: 'hold1', label: '암로디핀 보류와 사유', tip: 'SBP 100 미만이라 보류했다고 적습니다.', test: has(/암로디핀|amlodipine/i, /보류|hold|투여하지|투약하지|주지/i, /혈압|SBP|100/i) },
      { id: 'hold2', label: '아목시실린 보류와 알레르기 사유', tip: '페니실린 알레르기 때문에 보류.', test: has(/아목시실린|amoxicillin|클라불란|augmentin/i, /알레르기|알러지|allergy|페니실린/i, /보류|hold|투여하지|투약하지|주지/i) },
      { id: 'report', label: '의사 보고', tip: '누구에게 보고했고 지시를 받았는지.', test: has(/보고|연락|notify|처방의|담당의|의사|주치의|dr/i) },
      { id: 'obs', label: '투약 후 관찰·반응', tip: '소변량, 혈압, 이상 반응 유무 등.', test: has(/소변|I\/O|혈압|어지러|반응|이상\s*(없|증상)|관찰|모니터/) },
    ] },
  ],
};

const BRADEN: Scenario = {
  key: 'braden', title: '욕창사정', sub: 'Braden 사정 → 부위 관찰 → 중재 → 간호기록', goal: '관찰 내용을 Braden 6개 항목 점수로 바꾸고, 위험도·욕창 단계를 판단해 중재와 기록으로 이어간다.',
  patient: { name: '이정식', line: 'M/81 · 5병동 3호 2', dx: '뇌경색(입원 7일째)', allergy: '없음' },
  steps: [
    { t: 'info', title: '1. 관찰 내용 확인', lead: '아래는 근무 시작 때 환자를 사정하며 확인한 내용입니다.', tables: [
      { cap: '관찰', table: { head: ['영역', '관찰 내용'], rows: [
        ['감각 인지', '말을 걸면 반응하지만 불편함을 항상 표현하지는 못하고, 스스로 몸을 뒤척이지 못함'],
        ['습기', '기저귀 사용. 근무조마다 1회 이상 기저귀·침구를 교환함'],
        ['활동', '침상에서만 지냄 (침상 안정)'],
        ['가동성', '가끔 팔다리를 약간 움직이나 스스로 체위변경은 못함'],
        ['영양', '식사는 보통 절반 이하 섭취'],
        ['마찰·전단력', '침대 머리를 올리면 아래로 미끄러져 내려와 이동 시 도움이 필요함'],
        ['피부', '천골 부위에 손가락으로 눌러도 하얗게 변하지 않는 붉은 발적, 피부 손상 없음 (약 3×2cm)'],
      ] } },
    ] },
    { t: 'form', title: '2. Braden 사정 입력', lead: '각 항목 점수를 고르고 합계·위험도를 입력하세요. (1점이 가장 나쁨)', fields: [
      { id: 'sen', label: '감각 인지', opts: ['1', '2', '3', '4'], ans: '3', why: '말로 지시하면 반응하나 불편함을 항상 표현 못 함 = 3(약간 제한)' },
      { id: 'moi', label: '습기', opts: ['1', '2', '3', '4'], ans: '2', why: '근무조마다 1회 이상 교환 = 2(자주 축축함)' },
      { id: 'act', label: '활동', opts: ['1', '2', '3', '4'], ans: '1', why: '침상 안정 = 1' },
      { id: 'mob', label: '가동성', opts: ['1', '2', '3', '4'], ans: '2', why: '가끔 약간 움직이나 체위변경 불가 = 2(매우 제한)' },
      { id: 'nut', label: '영양', opts: ['1', '2', '3', '4'], ans: '2', why: '식사 절반 이하 = 2(부적절)' },
      { id: 'fri', label: '마찰·전단력', opts: ['1', '2', '3'], ans: '1', why: '이동 시 도움 필요·미끄러짐 = 1(문제 있음)' },
      { id: 'tot', label: '합계', unit: '점', ans: '11', why: '3+2+1+2+2+1 = 11' },
      { id: 'grd', label: '위험도', opts: ['매우 고위험(9 이하)', '고위험(10~12)', '중등도(13~14)', '저위험(15~18)'], ans: '고위험(10~12)' },
      { id: 'sit', label: '발적 부위', opts: ['천골', '뒤꿈치', '대전자부', '후두부'], ans: '천골' },
      { id: 'stg', label: '욕창 단계', opts: ['1단계', '2단계', '3단계', '4단계'], ans: '1단계', why: '눌러도 하얗게 변하지 않는 발적, 피부 손상 없음 = 1단계' },
    ] },
    { t: 'quiz', title: '3. 중재 선택', quizzes: [
      { id: 'q1', q: '적절한 간호중재를 모두 고르세요.', multi: true, opts: [{ id: 'a', t: '2시간마다 체위변경' }, { id: 'b', t: '압력분산 매트리스 적용' }, { id: 'c', t: '발적 부위를 문질러 마사지' }, { id: 'd', t: '침대 머리 30° 이하 유지(식사 때 제외)' }, { id: 'e', t: '영양팀 협진 의뢰' }, { id: 'f', t: '도넛형 방석 사용' }], ans: ['a', 'b', 'd', 'e'], why: '발적 부위 마사지와 도넛형 방석은 오히려 조직 손상·압력 증가를 일으켜 피합니다.' },
    ] },
    { t: 'note', title: '4. 간호기록', lead: '욕창 위험 사정 결과와 중재를 기록하세요.', focus: '욕창', rules: [
      { id: 'time', label: '시간', tip: '사정 시각.', test: has(/\d{1,2}\s*:\s*\d{2}|\d{1,2}시/) },
      { id: 'score', label: 'Braden 점수', tip: 'Braden 11점처럼 수치로.', test: has(/braden|브레이든/i, /\b11\b/) },
      { id: 'risk', label: '위험도 판단', tip: '고위험이라고 적습니다.', test: has(/고위험/) },
      { id: 'site', label: '부위(천골)', tip: '정확한 부위를 적습니다.', test: has(/천골|sacr/i) },
      { id: 'stage', label: '1단계·비창백성 발적', tip: '눌러도 하얗게 안 변하는 발적, 피부 손상 없음.', test: has(/1\s*단계|stage\s*1|비창백|하얗게\s*변하지|blanch/i) },
      { id: 'size', label: '크기', tip: '3×2cm처럼 크기를 남깁니다.', test: has(/3\s*[x×*]\s*2\s*cm|3\s*cm/i) },
      { id: 'act', label: '시행한 중재', tip: '체위변경, 압력분산 매트리스, 영양 협진 등.', test: has(/체위\s*변경|체위변환|압력\s*분산|매트리스|협진|영양/) },
      { id: 'plan', label: '재사정·보고', tip: '다음 사정 시점 또는 의사·팀 보고.', test: has(/재사정|재평가|지속\s*관찰|추후|보고|전달|인계/) },
    ] },
  ],
};

const VITAL: Scenario = {
  key: 'vital', title: '활력징후·임상관찰', sub: '측정 값 입력 → 이상 판단 → 보고·중재 → 간호기록', goal: '측정값을 정확히 입력하고 이상 소견을 가려 SBAR로 보고할 내용과 중재를 기록한다.',
  patient: { name: '최민준', line: 'M/55 · 4병동 8호 1', dx: '복막염 수술 후 1일째', allergy: '없음' },
  steps: [
    { t: 'info', title: '1. 측정 결과', lead: '14:00 임상관찰을 측정했습니다. 측정기에 표시된 값입니다.', tables: [
      { cap: '측정기 표시 (14:00)', table: { head: ['BP', 'HR', 'RR', 'BT', 'SpO₂'], rows: [['98/60 mmHg', '112 회/분', '24 회/분', '38.4 ℃', '93 % (실내공기)']] } },
      { cap: '그 외 관찰', table: { head: ['항목', '내용'], rows: [['의식', '명료'], ['통증', '복부 수술부위 NRS 6점'], ['수술부위', '드레싱 깨끗함, 삼출물 없음'], ['처방', '아세트아미노펜 PRN (체온 38.0℃ 이상)']] } },
    ] },
    { t: 'form', title: '2. 임상관찰 입력', lead: '위 측정값을 기록지에 입력하세요.', fields: [
      { id: 'sbp', label: '수축기 혈압', unit: 'mmHg', ans: '98' },
      { id: 'dbp', label: '이완기 혈압', unit: 'mmHg', ans: '60' },
      { id: 'hr', label: '맥박', unit: '회/분', ans: '112' },
      { id: 'rr', label: '호흡', unit: '회/분', ans: '24' },
      { id: 'bt', label: '체온', unit: '℃', ans: '38.4' },
      { id: 'spo', label: 'SpO₂', unit: '%', ans: '93' },
      { id: 'pain', label: '통증(NRS)', opts: ['0', '2', '4', '6', '8', '10'], ans: '6' },
    ] },
    { t: 'quiz', title: '3. 판단과 중재', quizzes: [
      { id: 'q1', q: '정상 범위를 벗어난 항목을 모두 고르세요.', multi: true, opts: [{ id: 'a', t: '체온 38.4℃' }, { id: 'b', t: '맥박 112회' }, { id: 'c', t: '호흡 24회' }, { id: 'd', t: 'SpO₂ 93%' }, { id: 'e', t: '혈압 98/60' }], ans: ['a', 'b', 'c', 'd'], why: '발열·빈맥·빈호흡·저산소가 함께 있어 패혈증 등 합병증 가능성을 고려합니다. 혈압은 아직 정상 하한이지만 추이를 봅니다.' },
      { id: 'q2', q: '지금 해야 할 간호를 모두 고르세요.', multi: true, opts: [{ id: 'a', t: '의사에게 SBAR로 보고' }, { id: 'b', t: 'PRN 해열제 오더 확인 후 투약' }, { id: 'c', t: '반좌위 자세와 산소 요구 확인' }, { id: 'd', t: '수술부위·복부 상태 재확인' }, { id: 'e', t: '다음 정규 시간까지 기다림' }, { id: 'f', t: '30분~1시간 뒤 활력징후 재측정' }], ans: ['a', 'b', 'c', 'd', 'f'], why: '이상 소견이 여러 개이므로 기다리지 않고 보고하고, 중재 후 재측정으로 반응을 확인합니다.' },
    ] },
    { t: 'note', title: '4. 간호기록', lead: '측정 결과, 판단, 보고, 중재, 재측정 계획을 기록하세요.', focus: '임상관찰', rules: [
      { id: 'time', label: '시간', tip: '측정 시각.', test: has(/\d{1,2}\s*:\s*\d{2}|\d{1,2}시/) },
      { id: 'bp', label: '혈압 98/60', tip: '수치를 그대로.', test: has(/98\s*\/\s*60/) },
      { id: 'hr', label: '맥박 112', tip: '수치를 그대로.', test: has(/112/) },
      { id: 'rr', label: '호흡 24', tip: '수치를 그대로.', test: has(/\b24\b/) },
      { id: 'bt', label: '체온 38.4', tip: '수치를 그대로.', test: has(/38\.4/) },
      { id: 'spo', label: 'SpO₂ 93', tip: '수치를 그대로.', test: has(/93\s*%|spo2|sp02|산소포화/i) },
      { id: 'rep', label: '의사 보고', tip: '누구에게 보고했는지.', test: has(/보고|연락|notify|의사|주치의|담당의|sbar/i) },
      { id: 'act', label: '중재(해열제·자세·산소 등)', tip: '시행한 처치.', test: has(/해열|아세트아미노펜|타이레놀|반좌위|산소|냉찜질|수액/) },
      { id: 'wnd', label: '수술부위·통증 관찰', tip: '드레싱 상태나 통증 점수.', test: has(/수술\s*부위|드레싱|삼출|통증|nrs/i) },
      { id: 'plan', label: '재측정 계획', tip: '30분~1시간 뒤 재측정.', test: has(/재측정|재확인|추후|다시\s*측정|경과\s*관찰|모니터/) },
    ] },
  ],
};

export const SCENARIOS: Scenario[] = [GIVE, BRADEN, VITAL];
export const scenarioOf = (key: string) => SCENARIOS.find(s => s.key === key);
