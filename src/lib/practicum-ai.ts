import { prisma } from './prisma';

// 하루 한도. Vercel 환경변수 AI_DAILY_LIMIT로 조절한다(기본 100)
export const AI_DAILY_LIMIT = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 100);

// 오늘 사용 횟수를 1 올리고, 한도를 넘었으면 false. 표가 없거나 오류면 막는다.
// bucket을 주면 별도 종류의 횟수로 센다(예: '#sum' = 요약 피드백)
export async function takeAiQuota(userId: string, bucket = '', limit = AI_DAILY_LIMIT): Promise<boolean> {
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10) + bucket;
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "PracticumAiUsage" ("userId", "day", "count") VALUES (${userId}, ${day}, 1)
      ON CONFLICT ("userId", "day") DO UPDATE SET "count" = "PracticumAiUsage"."count" + 1
      RETURNING "count"`;
    return (rows[0]?.count ?? limit + 1) <= limit;
  } catch {
    return false;
  }
}

// AI 호출이 실패하면 방금 센 횟수를 돌려준다
export async function refundAiQuota(userId: string, bucket = ''): Promise<void> {
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10) + bucket;
  try {
    await prisma.$executeRaw`
      UPDATE "PracticumAiUsage" SET "count" = GREATEST("count" - 1, 0) WHERE "userId" = ${userId} AND "day" = ${day}`;
  } catch {
    /* 무시 */
  }
}

// 오늘 남은 횟수 (표가 없거나 오류면 0)
export async function aiQuotaLeft(userId: string, bucket: string, limit: number): Promise<number> {
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10) + bucket;
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT "count" FROM "PracticumAiUsage" WHERE "userId" = ${userId} AND "day" = ${day}`;
    return Math.max(0, limit - (rows[0]?.count ?? 0));
  } catch {
    return 0;
  }
}
