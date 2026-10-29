// 퀴즈 분류 체계: 구분(학년) > 과목 > 퀴즈(category)
// 구분은 DB의 NursingTerm.grade 값을 사용하고, 값이 없는 예전 데이터는 3학년으로 본다.

export const GRADES = ['1학년', '2학년', '3학년', '4학년'] as const;
export const DEFAULT_GRADE = '3학년';

export interface NursingTerm {
  id: string;
  subject: string;
  term: string;
  englishTerm?: string | null;
  definition: string;
  example?: string | null;
  category?: string | null;
  grade?: string | null;
  itemType?: string | null;
  options?: string[];
  answer?: string | null;
}

export type QuizKind = 'TERM' | 'MULTIPLE_CHOICE';

// 문제형(객관식/OX/단답형 또는 보기가 있는 문항)인지 판별
export function isExamItem(t: NursingTerm): boolean {
  return (
    t.itemType === 'MULTIPLE_CHOICE' ||
    t.itemType === 'TRUE_FALSE' ||
    t.itemType === 'SHORT_ANSWER' ||
    (t.options?.length ?? 0) > 0
  );
}

export function kindOf(t: NursingTerm): QuizKind {
  return isExamItem(t) ? 'MULTIPLE_CHOICE' : 'TERM';
}

export function matchesContentType(t: NursingTerm, filter: 'all' | QuizKind): boolean {
  if (filter === 'all') return true;
  return kindOf(t) === filter;
}

export function gradeOf(t: Pick<NursingTerm, 'grade'>): string {
  return t.grade && (GRADES as readonly string[]).includes(t.grade) ? t.grade : DEFAULT_GRADE;
}

export interface SubjectEntry {
  name: string;
  grade: string;
}

// 과목 목록 (가나다순). 한 과목 안의 문항 grade가 섞여 있으면 첫 문항 기준.
export function buildSubjects(terms: NursingTerm[]): SubjectEntry[] {
  const map = new Map<string, string>();
  for (const t of terms) {
    if (!t.subject) continue;
    if (!map.has(t.subject)) map.set(t.subject, gradeOf(t));
  }
  return Array.from(map, ([name, grade]) => ({ name, grade })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

// 약어처럼 보이는지: 공백 없이 짧고 대문자/숫자/기호 위주 (CPD, C/S, PROM, T&A ...)
function looksAbbr(v: string): boolean {
  const t = v.trim();
  return /^[A-Za-z0-9/.&+\-]{1,10}$/.test(t) && /[A-Z]{2}|[A-Z][/&.+\-][A-Z]|[0-9]/.test(t);
}

// 예전에 약어/풀네임이 서로 바뀌어 저장된 용어를 바로잡는다 (term=약어, englishTerm=풀네임)
export function normalizeTerm<T extends { term: string; englishTerm?: string | null }>(t: T): T {
  const en = t.englishTerm?.trim();
  if (en && looksAbbr(en) && !looksAbbr(t.term) && /\s|[a-z]{4,}/.test(t.term.trim())) {
    return { ...t, term: en, englishTerm: t.term };
  }
  return t;
}
