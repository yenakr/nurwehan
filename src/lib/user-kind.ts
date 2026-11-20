import { prisma } from './prisma';

// 가입할 때 고른 유형(교수·조교 신청). 권한은 바뀌지 않고, 관리자가 확인해서 직접 바꾼다.
export async function setProfRequest(userId: string): Promise<void> {
  try {
    await prisma.$executeRaw`INSERT INTO "UserKind" ("userId", "kind") VALUES (${userId}, 'PROF') ON CONFLICT ("userId") DO NOTHING`;
  } catch {
    /* 표가 없으면 무시 */
  }
}

export async function getProfRequestIds(): Promise<Set<string>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ userId: string }>>`SELECT "userId" FROM "UserKind" WHERE "kind" = 'PROF'`;
    return new Set(rows.map(r => r.userId));
  } catch {
    return new Set();
  }
}
