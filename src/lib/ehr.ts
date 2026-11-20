import { randomUUID } from 'crypto';
import { prisma } from './prisma';

export type EhrRow = { id: string; title: string; subject: string | null; updatedAt: Date };
export type EhrListRow = EhrRow & {
  ward: string | null; bed: string | null; sampleKey: string | null;
  ptNo: string | null; name: string | null; ageSex: string | null; dx: string | null; doctor: string | null; admit: string | null;
  dept: string | null; visitTime: string | null; vstatus: string | null; ktas: string | null; zone: string | null; cc: string | null; discharged: string | null;
  submitted: string | null; reviewed: string | null;
};

export async function listCases(userId: string): Promise<EhrListRow[]> {
  try {
    return await prisma.$queryRaw<EhrListRow[]>`
      SELECT "id", "title", "subject", "updatedAt",
        "data"->'info'->>'ward' AS "ward", "data"->'info'->>'bed' AS "bed", "data"->'info'->>'sampleKey' AS "sampleKey",
        "data"->'info'->>'ptNo' AS "ptNo", "data"->'info'->>'name' AS "name", "data"->'info'->>'ageSex' AS "ageSex",
        "data"->'info'->>'dx' AS "dx", "data"->'info'->>'doctor' AS "doctor", "data"->'info'->>'admit' AS "admit",
        "data"->'info'->>'dept' AS "dept", "data"->'info'->>'visitTime' AS "visitTime", "data"->'info'->>'vstatus' AS "vstatus",
        "data"->'info'->>'ktas' AS "ktas", "data"->'info'->>'zone' AS "zone", "data"->'info'->>'cc' AS "cc",
        "data"->'info'->>'discharged' AS "discharged",
        "data"->'info'->>'submitted' AS "submitted", "data"->'info'->>'reviewed' AS "reviewed"
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
      WHERE "userId" = ${userId} AND "id" = ${id} AND ("data"->'info'->>'submitted' IS NULL)`;
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

// ---- 제출·교수 열람 (표를 바꾸지 않고 차트 data.info 안에 상태를 둔다) ----
export async function submitCase(userId: string, id: string, on: boolean): Promise<boolean> {
  try {
    const n = on
      ? await prisma.$executeRaw`
          UPDATE "EhrCase" SET "data" = jsonb_set("data", '{info,submitted}', to_jsonb(${new Date().toISOString()}::text), true), "updatedAt" = CURRENT_TIMESTAMP
          WHERE "userId" = ${userId} AND "id" = ${id} AND "data"->'info'->>'submitted' IS NULL`
      : await prisma.$executeRaw`
          UPDATE "EhrCase" SET "data" = "data" #- '{info,submitted}', "updatedAt" = CURRENT_TIMESTAMP
          WHERE "userId" = ${userId} AND "id" = ${id} AND "data"->'info'->>'submitted' IS NOT NULL AND "data"->'info'->>'reviewed' IS NULL`;
    return n > 0;
  } catch {
    return false;
  }
}

export async function isLocked(userId: string, id: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ s: string | null }>>`
      SELECT "data"->'info'->>'submitted' AS "s" FROM "EhrCase" WHERE "userId" = ${userId} AND "id" = ${id}`;
    return !!rows[0]?.s;
  } catch {
    return false;
  }
}

export async function listSubmittedCases() {
  try {
    return await prisma.$queryRaw<Array<{ id: string; userId: string; title: string; submitted: string; reviewed: string | null }>>`
      SELECT "id", "userId", "title", "data"->'info'->>'submitted' AS "submitted", "data"->'info'->>'reviewed' AS "reviewed"
      FROM "EhrCase" WHERE "data"->'info'->>'submitted' IS NOT NULL ORDER BY "data"->'info'->>'submitted' DESC LIMIT 300`;
  } catch {
    return [];
  }
}

export async function getCaseAny(id: string) {
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; userId: string; title: string; data: unknown }>>`
      SELECT "id", "userId", "title", "data" FROM "EhrCase" WHERE "id" = ${id}`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function setReview(id: string, comment: string): Promise<boolean> {
  try {
    const n = await prisma.$executeRaw`
      UPDATE "EhrCase" SET "data" = jsonb_set(jsonb_set("data", '{info,comment}', to_jsonb(${comment}::text), true), '{info,reviewed}', to_jsonb(${new Date().toISOString()}::text), true)
      WHERE "id" = ${id} AND "data"->'info'->>'submitted' IS NOT NULL`;
    return n > 0;
  } catch {
    return false;
  }
}

// 병동 단위 활력징후 일괄 입력: 제출 전 본인 차트에만 한 줄씩 덧붙인다
export async function appendVitals(userId: string, items: { id: string; row: Record<string, string> }[]): Promise<number> {
  let done = 0;
  for (const it of items) {
    try {
      const n = await prisma.$executeRaw`
        UPDATE "EhrCase" SET "data" = jsonb_set("data", '{vitals}', COALESCE("data"->'vitals', '[]'::jsonb) || ${JSON.stringify([it.row])}::jsonb, true),
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "userId" = ${userId} AND "id" = ${it.id} AND ("data"->'info'->>'submitted' IS NULL)`;
      if (n > 0) done++;
    } catch { /* 한 건 실패해도 나머지는 계속 */ }
  }
  return done;
}
