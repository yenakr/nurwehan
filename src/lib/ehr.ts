import { randomUUID } from 'crypto';
import { prisma } from './prisma';

export type EhrRow = { id: string; title: string; subject: string | null; updatedAt: Date };
export type EhrListRow = EhrRow & {
  ward: string | null; bed: string | null; sampleKey: string | null;
  ptNo: string | null; name: string | null; ageSex: string | null; dx: string | null; doctor: string | null; admit: string | null;
  dept: string | null; visitTime: string | null; vstatus: string | null; ktas: string | null; zone: string | null; cc: string | null;
};

export async function listCases(userId: string): Promise<EhrListRow[]> {
  try {
    return await prisma.$queryRaw<EhrListRow[]>`
      SELECT "id", "title", "subject", "updatedAt",
        "data"->'info'->>'ward' AS "ward", "data"->'info'->>'bed' AS "bed", "data"->'info'->>'sampleKey' AS "sampleKey",
        "data"->'info'->>'ptNo' AS "ptNo", "data"->'info'->>'name' AS "name", "data"->'info'->>'ageSex' AS "ageSex",
        "data"->'info'->>'dx' AS "dx", "data"->'info'->>'doctor' AS "doctor", "data"->'info'->>'admit' AS "admit",
        "data"->'info'->>'dept' AS "dept", "data"->'info'->>'visitTime' AS "visitTime", "data"->'info'->>'vstatus' AS "vstatus",
        "data"->'info'->>'ktas' AS "ktas", "data"->'info'->>'zone' AS "zone", "data"->'info'->>'cc' AS "cc"
      FROM "EhrCase"
      WHERE "userId" = ${userId} ORDER BY "updatedAt" DESC LIMIT 100`;
  } catch {
    return [];
  }
}

export async function getCase(userId: string, id: string) {
  try {
    const rows = await prisma.$queryRaw<Array<EhrRow & { data: unknown }>>`
      SELECT "id", "title", "subject", "data", "updatedAt" FROM "EhrCase"
      WHERE "userId" = ${userId} AND "id" = ${id}`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function createCase(userId: string, title: string, subject: string | null, data: unknown) {
  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO "EhrCase" ("id", "userId", "title", "subject", "data")
      VALUES (${id}, ${userId}, ${title}, ${subject}, ${JSON.stringify(data)}::jsonb)`;
    return id;
  } catch {
    return null;
  }
}

export async function saveCase(userId: string, id: string, title: string, subject: string | null, data: unknown) {
  try {
    const n = await prisma.$executeRaw`
      UPDATE "EhrCase" SET "title" = ${title}, "subject" = ${subject}, "data" = ${JSON.stringify(data)}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${userId} AND "id" = ${id}`;
    return n > 0;
  } catch {
    return false;
  }
}

export async function removeCase(userId: string, id: string) {
  try {
    await prisma.$executeRaw`DELETE FROM "EhrCase" WHERE "userId" = ${userId} AND "id" = ${id}`;
    return true;
  } catch {
    return false;
  }
}
