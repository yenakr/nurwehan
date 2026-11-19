import { prisma } from './prisma';

export const AI_DAILY_LIMIT = 20;

// 오늘 사용 횟수를 1 올리고, 한도를 넘었으면 false. 표가 없거나 오류면 막는다.
export async function takeAiQuota(userId: string): Promise<boolean> {
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "PracticumAiUsage" ("userId", "day", "count") VALUES (${userId}, ${day}, 1)
      ON CONFLICT ("userId", "day") DO UPDATE SET "count" = "PracticumAiUsage"."count" + 1
      RETURNING "count"`;
    return (rows[0]?.count ?? AI_DAILY_LIMIT + 1) <= AI_DAILY_LIMIT;
  } catch {
    return false;
  }
}
