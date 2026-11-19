import { prisma } from './prisma';
import { isAdminRole } from './auth-core';

type Viewer = { id: string; role: string; approvalStatus?: string | null } | null | undefined;

// 체크리스트와 AI 기능은 관리자가 지정한 사용자(와 관리자)만 쓴다. 표가 없거나 오류면 막는다.
export async function hasChecklistAccess(user: Viewer): Promise<boolean> {
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  if (user.approvalStatus !== 'APPROVED') return false;
  try {
    const rows = await prisma.$queryRaw<Array<{ ok: number }>>`
      SELECT 1 AS ok FROM "ChecklistAccess" WHERE "userId" = ${user.id}`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function getChecklistUserIds(): Promise<Set<string>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ userId: string }>>`SELECT "userId" FROM "ChecklistAccess"`;
    return new Set(rows.map(r => r.userId));
  } catch {
    return new Set();
  }
}

export async function setChecklistAccess(userId: string, on: boolean): Promise<void> {
  if (on) {
    await prisma.$executeRaw`INSERT INTO "ChecklistAccess" ("userId") VALUES (${userId}) ON CONFLICT ("userId") DO NOTHING`;
  } else {
    await prisma.$executeRaw`DELETE FROM "ChecklistAccess" WHERE "userId" = ${userId}`;
  }
}
