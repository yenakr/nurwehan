import { isAdminRole } from './auth-core';
import { hasChecklistAccess } from './checklist-access';
import { hasEhrAccess } from './ehr-access';
import { pickPlacement, type Placement } from './placement-pick';
import type { HomeTilesData } from '@/app/HomeTiles';

type Viewer = { id: string; role: string; approvalStatus?: string | null } | null;

// 실습 과목 → 퀴즈 과목명
const QUIZ_SUBJECT: Record<string, string> = {
  성인1: '성인간호실습1',
  성인2: '성인간호실습2',
  간호과정: '간호과정실습',
  여성: '여성간호실습',
};

export async function getHomeTiles(user: Viewer, placements: Placement[]): Promise<HomeTilesData> {
  const ok = !!user && (user.approvalStatus === 'APPROVED' || isAdminRole(user.role));
  if (!user || !ok) return { canCheck: false, canEhr: false, quizSubject: null };
  const canCheck = await hasChecklistAccess(user).catch(() => false);
  const canEhr = await hasEhrAccess(user).catch(() => false);
  const pick = placements.length ? pickPlacement(placements, new Date()) : null;
  const course = pick?.kind === 'current' ? pick.items[0]?.subject.split('_')[0] : undefined;
  const subject = course ? QUIZ_SUBJECT[course] : undefined;
  return { canCheck, canEhr, quizSubject: subject ? { subject, label: subject } : null };
}
