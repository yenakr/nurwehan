import { prisma } from './prisma';

// 하루 한도. Vercel 환경변수 AI_DAILY_LIMIT로 조절한다(기본 100)
export const AI_DAILY_LIMIT = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 100);

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

// AI 호출이 실패하면 방금 센 횟수를 돌려준다
export async function refundAiQuota(userId: string): Promise<void> {
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  try {
    await prisma.$executeRaw`
      UPDATE "PracticumAiUsage" SET "count" = GREATEST("count" - 1, 0) WHERE "userId" = ${userId} AND "day" = ${day}`;
  } catch {
    /* 무시 */
  }
}
