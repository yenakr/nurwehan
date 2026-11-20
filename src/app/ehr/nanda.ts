// NANDA 분류체계 II (2007) 간호진단 목록: 영역별 [한글명, 영문명]
const P = (s: string): [string, string][] => s.trim().split('\n').map(l => l.split('|') as [string, string]);

export const NANDA: { domain: string; items: [string, string][] }[] = [
  { domain: '건강증진', items: P(`
건강추구 행위|Health-seeking behaviors
비효율적 가정관리|Impaired home maintenance
치료요법의 비효율적 이행: 지역사회|Ineffective community therapeutic regimen management
치료요법의 비효율적 이행: 가족|Ineffective family therapeutic regimen management
건강유지 능력변화|Ineffective health maintenance
치료요법의 비효율적 이행|Ineffective therapeutic regimen management
치료요법의 효율적 이행|Effective therapeutic regimen management
치료요법의 이행 향상 가능성|Readiness for enhanced therapeutic regimen management
영양향상 가능성|Readiness for enhanced nutrition
면역상태 향상 가능성|Readiness for enhanced immunization status`) },
  { domain: '영양', items: P(`
비효율적 수유|Ineffective infant feeding pattern
연하장애|Impaired swallowing
영양불균형: 영양부족|Imbalanced nutrition: Less than body requirements
영양불균형: 영양과다|Imbalanced nutrition: More than body requirements
영양과다 위험성|Risk for imbalanced nutrition: More than body requirements
간 기능장애 위험성|Risk for impaired liver function
불안정한 혈당치 위험성|Risk for unstable blood glucose level
체액부족|Deficient fluid volume
체액부족 위험성|Risk for deficient fluid volume
체액불균형 위험성|Risk for imbalanced fluid volume
체액과다|Excess fluid volume
체액균형 향상 가능성|Readiness for enhanced fluid balance`) },
  { domain: '배설', items: P(`
배뇨장애|Impaired urinary elimination
소변정체|Urinary retention
전 요실금|Total urinary incontinence
기능적 요실금|Functional urinary incontinence
복압성 요실금|Stress urinary incontinence
긴박성 요실금|Urge urinary incontinence
신경인성 요실금|Reflex urinary incontinence
긴박성 요실금 위험성|Risk for urge urinary incontinence
요배설 향상 가능성|Readiness for enhanced urinary elimination
축뇨성 요실금|Overflow urinary incontinence
변실금|Bowel incontinence
변비|Constipation
설사|Diarrhea
상상변비|Perceived constipation
변비 위험성|Risk for constipation
가스교환장애|Impaired gas exchange`) },
  { domain: '활동/휴식', items: P(`
불면증|Insomnia
수면 박탈|Sleep deprivation
수면 향상 가능성|Readiness for enhanced sleep
비사용 증후군 위험성|Risk for disuse syndrome
침상 체위이동 장애|Impaired bed mobility
운동 장애|Impaired physical mobility
이동 능력 장애|Impaired transfer ability
보행 장애|Impaired walking
휠체어 사용 장애|Impaired wheelchair mobility
여가활동부족|Deficient diversional activity
수술 후 회복지연|Delayed surgical recovery
비활동적 생활양식|Sedentary lifestyle
에너지 교류장애|Disturbed energy field
피로|Fatigue
활동의 지속성 장애|Activity intolerance
심박출량 감소|Decreased cardiac output
호흡기제거에 대한 부적응|Dysfunctional ventilatory weaning response
호흡기능장애|Impaired spontaneous ventilation
비효율적 호흡양상|Ineffective breathing pattern
조직관류 장애|Ineffective tissue perfusion
활동의 지속성 장애 위험성|Risk for activity intolerance
자가간호 결핍: 옷입기/치장하기|Dressing/grooming self-care deficit
자가간호 결핍: 목욕/위생|Bathing/hygiene self-care deficit
자가간호 결핍: 식사하기|Feeding self-care deficit
자가간호 결핍: 화장실 이용|Toileting self-care deficit
자가간호 결핍: 가능성|Readiness for enhanced self-care`) },
  { domain: '지각/인지', items: P(`
편측성 지각장애|Unilateral neglect
환경인지 장애 증후군|Impaired environmental interpretation syndrome
배회|Wandering
감각지각 장애|Disturbed sensory perception
급성혼동|Acute confusion
만성혼동|Chronic confusion
지식부족|Deficient knowledge
사고과정 장애|Disturbed thought processes
기억 장애|Impaired memory
지식 향상 가능성|Readiness for enhanced knowledge
의사결정 향상 가능성|Readiness for enhanced decision making
급성혼동 위험성|Risk for acute confusion
언어소통 장애|Impaired verbal communication
의사소통 향상 가능성|Readiness for enhanced communication`) },
  { domain: '자아인식', items: P(`
자아정체성 장애|Disturbed personal identity
절망감|Hopelessness
무력감|Powerlessness
외로움 위험성|Risk for loneliness
무력감 위험성|Risk for powerlessness
자아개념 향상 가능성|Readiness for enhanced self-concept
힘의 향상 가능성|Readiness for enhanced power
인간 존엄성 손상 위험성|Risk for compromised human dignity
희망 향상 가능성|Readiness for enhanced hope
만성적 자긍심 저하|Chronic low self-esteem
상황적 자긍심저하 위험성|Risk for situational low self-esteem
상황적 자긍심저하|Situational low self-esteem
신체상 장애|Disturbed body image`) },
  { domain: '역할관계', items: P(`
돌봄 제공자 역할 부담감|Caregiver role strain
돌봄 제공자 역할 부담감의 위험성|Risk for caregiver role strain
부모 역할 장애|Impaired parenting
부모 역할 장애 위험성|Risk for impaired parenting
부모역할 향상 가능성|Readiness for enhanced parenting
가족과정 중단|Interrupted family processes
가족과정 향상 가능성|Readiness for enhanced family processes
가족과정 기능 장애: 알코올중독|Dysfunctional family processes: alcoholism
부모/영아/아동 애착 장애 위험성|Risk for impaired parent/infant/child attachment
사회적 상호작용 장애|Impaired social interaction
비효율적 모유수유|Ineffective breast feeding
역할수행 장애|Ineffective role performance
모유수유 장애|Interrupted breast feeding
효율적 모유수유|Effective breast feeding
부모역할 갈등|Parental role conflict`) },
  { domain: '성', items: P(`
성문제 호소|Ineffective sexuality patterns
성기능 장애|Sexual dysfunction`) },
  { domain: '대응/스트레스 내성', items: P(`
환경변화 스트레스 증후군|Relocation stress syndrome
환경변화 스트레스 증후군 위험성|Risk for relocation stress syndrome
강간상해 증후군|Rape-trauma syndrome
강간상해 증후군: 복합반응|Rape-trauma syndrome: Compound reaction
강간상해 증후군: 침묵반응|Rape-trauma syndrome: Silent reaction
외상 후 증후군|Post-trauma syndrome
외상 후 증후군 위험성|Risk for post-trauma syndrome
두려움|Fear
불안|Anxiety
죽음불안|Death anxiety
만성 비탄|Chronic sorrow
부정반응|Ineffective denial
슬픔|Grieving
복합적 슬픔|Complicated grieving
가족대응 불능|Disabled family coping
지역사회의 비효율적 대응|Ineffective community coping
가족의 비효율적 대응|Compromised family coping
방어적 대응|Defensive coping
비효율적 대응|Ineffective coping
대응 향상 가능성(개인)|Readiness for enhanced coping (individual)
가족 대응의 향상 가능성|Readiness for enhanced family coping
지역사회 대응의 향상 가능성|Readiness for enhanced community coping
복합적 슬픔 위험성|Risk for complicated grieving
과잉 스트레스|Stress overload
모험적 건강행위|Risk-prone health behavior
자율신경 반사 장애|Autonomic dysreflexia
자율신경 반사 장애 위험성|Risk for autonomic dysreflexia
영아의 비조직적 행위|Disorganized infant behavior
영아의 비조직적 행위 위험성|Risk for disorganized infant behavior
두개 내압 조절력 감소|Decreased intracranial adaptive capacity
영아의 조직적 행위 향상 가능성|Readiness for enhanced organized infant behavior`) },
  { domain: '삶의 원칙', items: P(`
영적 안녕 향상 가능성|Readiness for enhanced spiritual well-being
영적 고뇌|Spiritual distress
영적 고뇌 위험성|Risk for spiritual distress
도덕적 고뇌|Moral distress
결정갈등|Decisional conflict
비순응|Noncompliance
종교성 장애|Impaired religiosity`) },
  { domain: '안전/보호', items: P(`
감염 위험성|Risk for infection
비효율적 기도청결|Ineffective airway clearance
흡인 위험성|Risk for aspiration
비효율적 체온조절|Ineffective thermoregulation
체온상승|Hyperthermia
체온하강|Hypothermia
체온불균형 위험성|Risk for imbalanced body temperature
낙상 위험성|Risk for falls
손상 위험성|Risk for injury
외상 위험성|Risk for trauma
질식 위험성|Risk for suffocation
중독 위험성|Risk for poisoning
피부통합성 장애|Impaired skin integrity
피부통합성 장애 위험성|Risk for impaired skin integrity
조직통합성 장애|Impaired tissue integrity
구강점막 손상|Impaired oral mucous membrane
치아 손상|Impaired dentition
말초신경혈관 기능장애 위험성|Risk for peripheral neurovascular dysfunction
라텍스 알레르기 반응|Latex allergy response
라텍스 알레르기 반응 위험성|Risk for latex allergy response
자해|Self-mutilation
자해 위험성|Risk for self-mutilation
자살 위험성|Risk for suicide
자신에 대한 폭력 위험성|Risk for self-directed violence
타인에 대한 폭력 위험성|Risk for other-directed violence
방어 비효율|Ineffective protection
배회|Wandering`) },
  { domain: '안위', items: P(`
급성 통증|Acute pain
만성 통증|Chronic pain
오심|Nausea
사회적 고립|Social isolation
안위 향상 가능성|Readiness for enhanced comfort`) },
  { domain: '성장/발달', items: P(`
성장 장애|Delayed growth and development
성장불균형 위험성|Risk for disproportionate growth
발달 지연 위험성|Risk for delayed development
성인 성장장애|Adult failure to thrive`) },
];

// 간호진단 진술 오류 점검 (법적·의학적 문제, 가치판단, 두 가지 문제 동시 진술)
export function dxIssues(dx: string): string[] {
  const t = dx.trim();
  if (!t) return [];
  const out: string[] = [];
  const m = t.match(/^(.*?)(?:과|와)\s*관련된?\s*(.*)$/);
  const cause = m ? m[1] : '';
  const diag = m ? m[2] : t;
  if (/(난간|억제대|보호대|안전장치|침상).*(없|미비|부족)|(없|미비|부족)음?(과|와)\s*관련/.test(t)) out.push('법적 문제가 될 수 있는 진술이에요');
  if (/(암|절제술|저혈량증|심부전|당뇨병|폐렴|뇌졸중|고혈압|경색|출혈)/.test(cause)) out.push('원인에 의학용어나 진단명을 쓰지 마세요');
  if (/(결코|무신론|게으른|비협조|불성실|나쁜|고집)/.test(t)) out.push('가치판단이 들어 있어요');
  if (m && diag.split(/\s*(?:과|와|및|,)\s*/).filter(x => x.trim().length >= 2).length >= 2) out.push('두 가지 문제를 한 진단에 쓰지 마세요');
  return out;
}
