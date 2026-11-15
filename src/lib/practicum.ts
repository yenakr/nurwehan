import { prisma } from './prisma';

export async function getProgress(userId: string, subject: string): Promise<Record<string, unknown>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ data: Record<string, unknown> }>>`
      SELECT "data" FROM "PracticumProgress" WHERE "userId" = ${userId} AND "subject" = ${subject}`;
    return rows[0]?.data ?? {};
  } catch {
    return {};
  }
}

export async function getAllProgress(userId: string): Promise<Record<string, Record<string, unknown>>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ subject: string; data: Record<string, unknown> }>>`
      SELECT "subject", "data" FROM "PracticumProgress" WHERE "userId" = ${userId}`;
    return Object.fromEntries(rows.map(r => [r.subject, r.data]));
  } catch {
    return {};
  }
}

export async function saveProgress(userId: string, subject: string, data: unknown) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "PracticumProgress" ("userId", "subject", "data") VALUES (${userId}, ${subject}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT ("userId", "subject") DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = CURRENT_TIMESTAMP`;
    return true;
  } catch {
    return false;
  }
}
