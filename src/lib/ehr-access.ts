import { prisma } from './prisma';
import { isAdminRole } from './auth-core';

type Viewer = { id: string; role: string; approvalStatus?: string | null } | null | undefined;

// EHR은 관리자가 지정한 사용자(와 관리자)만 쓴다. 표가 없거나 오류면 막는다.
export async function hasEhrAccess(user: Viewer): Promise<boolean> {
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  if (user.approvalStatus !== 'APPROVED') return false;
  try {
    const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok FROM "EhrAccess" WHERE "userId" = ${user.id}`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function getEhrUserIds(): Promise<Set<string>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ userId: string }>>`SELECT "userId" FROM "EhrAccess"`;
    return new Set(rows.map(r => r.userId));
  } catch {
    return new Set();
  }
}

export async function setEhrAccess(userId: string, on: boolean): Promise<void> {
  if (on) {
    await prisma.$executeRaw`INSERT INTO "EhrAccess" ("userId") VALUES (${userId}) ON CONFLICT ("userId") DO NOTHING`;
  } else {
    await prisma.$executeRaw`DELETE FROM "EhrAccess" WHERE "userId" = ${userId}`;
  }
}

// EHR AI 하루 한도 (Vercel 환경변수로 조절)
export const EHR_FEEDBACK_LIMIT = Math.max(1, Number(process.env.EHR_FEEDBACK_LIMIT) || 10);
export const EHR_CASE_LIMIT = Math.max(1, Number(process.env.EHR_CASE_LIMIT) || 5);
