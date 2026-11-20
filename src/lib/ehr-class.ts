import { randomUUID } from 'crypto';
import { prisma } from './prisma';

export type EhrClass = { id: string; year: string; term: string; subject: string; grade: string; section: string; professor: string; members: number };
export type EhrVirtualRow = { id: string; classId: string | null; published: boolean; data: unknown };

// ---- 분반 ----
export async function listClasses(): Promise<EhrClass[]> {
  try {
    return await prisma.$queryRaw<EhrClass[]>`
      SELECT c."id", c."year", c."term", c."subject", c."grade", c."section", c."professor",
        (SELECT COUNT(*)::int FROM "EhrClassMember" m WHERE m."classId" = c."id") AS "members"
      FROM "EhrClass" c ORDER BY c."year" DESC, c."term" DESC, c."subject"`;
  } catch {
    return [];
  }
}

export async function createClass(c: Omit<EhrClass, 'id' | 'members'>): Promise<string | null> {
  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO "EhrClass" ("id", "year", "term", "subject", "grade", "section", "professor")
      VALUES (${id}, ${c.year}, ${c.term}, ${c.subject}, ${c.grade}, ${c.section}, ${c.professor})`;
    return id;
  } catch {
    return null;
  }
}

export async function updateClass(id: string, c: Omit<EhrClass, 'id' | 'members'>): Promise<boolean> {
  try {
    const n = await prisma.$executeRaw`
      UPDATE "EhrClass" SET "year" = ${c.year}, "term" = ${c.term}, "subject" = ${c.subject}, "grade" = ${c.grade}, "section" = ${c.section}, "professor" = ${c.professor}
      WHERE "id" = ${id}`;
    return n > 0;
  } catch {
    return false;
  }
}

export async function removeClass(id: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`DELETE FROM "EhrClassMember" WHERE "classId" = ${id}`;
    await prisma.$executeRaw`UPDATE "EhrVirtual" SET "classId" = NULL, "published" = false WHERE "classId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "EhrClass" WHERE "id" = ${id}`;
    return true;
  } catch {
    return false;
  }
}

export async function classMembers(): Promise<Array<{ classId: string; userId: string }>> {
  try {
    return await prisma.$queryRaw`SELECT "classId", "userId" FROM "EhrClassMember"`;
  } catch {
    return [];
  }
}

export async function setMember(classId: string, userId: string, on: boolean): Promise<boolean> {
  try {
    if (on) await prisma.$executeRaw`INSERT INTO "EhrClassMember" ("classId", "userId") VALUES (${classId}, ${userId}) ON CONFLICT DO NOTHING`;
    else await prisma.$executeRaw`DELETE FROM "EhrClassMember" WHERE "classId" = ${classId} AND "userId" = ${userId}`;
    return true;
  } catch {
    return false;
  }
}

// ---- 가상환자 ----
export async function listVirtuals(): Promise<EhrVirtualRow[]> {
  try {
    return await prisma.$queryRaw<EhrVirtualRow[]>`SELECT "id", "classId", "published", "data" FROM "EhrVirtual" ORDER BY "createdAt" DESC LIMIT 300`;
  } catch {
    return [];
  }
}

export async function createVirtual(data: unknown, classId: string | null): Promise<string | null> {
  const id = randomUUID();
  try {
    await prisma.$executeRaw`INSERT INTO "EhrVirtual" ("id", "classId", "published", "data") VALUES (${id}, ${classId}, false, ${JSON.stringify(data)}::jsonb)`;
    return id;
  } catch {
    return null;
  }
}

export async function patchVirtual(id: string, p: { published?: boolean; classId?: string | null; info?: Record<string, string> }): Promise<boolean> {
  try {
    if (p.published !== undefined) await prisma.$executeRaw`UPDATE "EhrVirtual" SET "published" = ${p.published}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`;
    if (p.classId !== undefined) await prisma.$executeRaw`UPDATE "EhrVirtual" SET "classId" = ${p.classId}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`;
    if (p.info) {
      for (const [k, v] of Object.entries(p.info)) {
        await prisma.$executeRaw`UPDATE "EhrVirtual" SET "data" = jsonb_set("data", ARRAY['info', ${k}]::text[], to_jsonb(${v}::text), true), "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function removeVirtual(id: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`DELETE FROM "EhrVirtual" WHERE "id" = ${id}`;
    return true;
  } catch {
    return false;
  }
}

// 학생에게 보이는 공개 가상환자: 전체 공개(분반 없음) 또는 본인이 속한 분반
export async function studentVirtuals(userId: string): Promise<EhrVirtualRow[]> {
  try {
    return await prisma.$queryRaw<EhrVirtualRow[]>`
      SELECT v."id", v."classId", v."published", v."data" FROM "EhrVirtual" v
      WHERE v."published" = true AND (v."classId" IS NULL OR v."classId" IN (SELECT m."classId" FROM "EhrClassMember" m WHERE m."userId" = ${userId}))
      ORDER BY v."createdAt" DESC LIMIT 100`;
  } catch {
    return [];
  }
}
