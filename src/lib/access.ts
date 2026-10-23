import { prisma } from './prisma';
import { isAdminRole, isSuperAdmin } from './auth-core';

// 과목 공개 범위: 없음 = 일반, PARTIAL = 일부공개, PRIVATE = 관리자만
export type SubjectLevel = 'PARTIAL' | 'PRIVATE';

export async function getSubjectLevels(): Promise<Record<string, SubjectLevel>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ subject: string; level: string }>>`
      SELECT "subject", "level" FROM "SubjectVisibility"`;
    const out: Record<string, SubjectLevel> = {};
    for (const r of rows) if (r.level === 'PARTIAL' || r.level === 'PRIVATE') out[r.subject] = r.level;
    return out;
  } catch {
    return {};
  }
}

export async function getTier(userId: string): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ tier: number }>>`
      SELECT "tier" FROM "User" WHERE "id" = ${userId}`;
    return Number(rows[0]?.tier ?? 0);
  } catch {
    return 0;
  }
}

export async function getTiers(): Promise<Record<string, number>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; tier: number }>>`
      SELECT "id", "tier" FROM "User" WHERE "tier" > 0`;
    return Object.fromEntries(rows.map(r => [r.id, Number(r.tier)]));
  } catch {
    return {};
  }
}

export async function setTier(userId: string, tier: number): Promise<void> {
  await prisma.$executeRaw`UPDATE "User" SET "tier" = ${tier} WHERE "id" = ${userId}`;
}

export async function setSubjectLevel(subject: string, level: SubjectLevel | null): Promise<void> {
  if (!level) {
    await prisma.$executeRaw`DELETE FROM "SubjectVisibility" WHERE "subject" = ${subject}`;
    return;
  }
  await prisma.$executeRaw`
    INSERT INTO "SubjectVisibility" ("subject", "level") VALUES (${subject}, ${level})
    ON CONFLICT ("subject") DO UPDATE SET "level" = EXCLUDED."level"`;
}

export async function renameSubjectLevel(from: string, to: string): Promise<void> {
  try {
    await prisma.$executeRaw`UPDATE "SubjectVisibility" SET "subject" = ${to} WHERE "subject" = ${from}`;
  } catch {}
}

type Viewer = { id: string; role: string; approvalStatus?: string | null } | null | undefined;

// 이 사용자에게 보이지 않아야 하는 과목 목록
export async function hiddenSubjectsFor(user: Viewer): Promise<string[]> {
  if (user && isSuperAdmin(user.role)) return [];
  const levels = await getSubjectLevels();
  const entries = Object.entries(levels);
  if (entries.length === 0) return [];
  const isAdmin = !!user && isAdminRole(user.role);
  const tier = isAdmin ? 1 : user && user.approvalStatus === 'APPROVED' ? await getTier(user.id) : 0;
  return entries
    .filter(([, level]) => level === 'PRIVATE' || (level === 'PARTIAL' && tier < 1))
    .map(([subject]) => subject);
}
