import { prisma } from './prisma';

export async function getFavoriteIds(userId: string): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{ termId: string }>>`
      SELECT "termId" FROM "TermFavorite" WHERE "userId" = ${userId}`;
    return rows.map(r => r.termId);
  } catch {
    return [];
  }
}

export async function setFavorite(userId: string, termId: string, on: boolean): Promise<boolean> {
  try {
    if (on) {
      await prisma.$executeRaw`
        INSERT INTO "TermFavorite" ("userId", "termId") VALUES (${userId}, ${termId})
        ON CONFLICT DO NOTHING`;
    } else {
      await prisma.$executeRaw`DELETE FROM "TermFavorite" WHERE "userId" = ${userId} AND "termId" = ${termId}`;
    }
    return true;
  } catch {
    return false;
  }
}
