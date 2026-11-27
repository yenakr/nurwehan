import { randomUUID } from 'crypto';
import { prisma } from './prisma';

export type EhrRow = { id: string; title: string; subject: string | null; updatedAt: Date };
export type EhrListRow = EhrRow & {
  ward: string | null; bed: string | null; sampleKey: string | null;
  ptNo: string | null; name: string | null; ageSex: string | null; dx: string | null; doctor: string | null; attending: string | null; admit: string | null;
  dept: string | null; visitTime: string | null; vstatus: string | null; ktas: string | null; zone: string | null; cc: string | null; discharged: string | null;
  submitted: string | null; reviewed: string | null; badges: string | null; disDate: string | null;
};

export type EhrMode = 'free' | 'skill';

// 자율 EHR과 핵심술기 EHR은 같은 표를 쓰되 차트 info.mode로 완전히 나눈다
export async function listCases(userId: string, mode: EhrMode = 'free'): Promise<EhrListRow[]> {
  const sk = mode === 'skill';
  try {
    return await prisma.$queryRaw<EhrListRow[]>`
      SELECT "id", "title", "subject", "updatedAt",
        "data"->'info'->>'ward' AS "ward", "data"->'info'->>'bed' AS "bed", "data"->'info'->>'sampleKey' AS "sampleKey",
        RIGHT("data"->'info'->>'ptNo', 4) AS "ptNo", "data"->'info'->>'name' AS "name", "data"->'info'->>'ageSex' AS "ageSex",
        "data"->'info'->>'dx' AS "dx", "data"->'info'->>'doctor' AS "doctor", "data"->'info'->>'attending' AS "attending", "data"->'info'->>'admit' AS "admit",
        "data"->'info'->>'dept' AS "dept", "data"->'info'->>'visitTime' AS "visitTime", "data"->'info'->>'vstatus' AS "vstatus",
        "data"->'info'->>'ktas' AS "ktas", "data"->'info'->>'zone' AS "zone", "data"->'info'->>'cc' AS "cc",
        "data"->'info'->>'discharged' AS "discharged",
        "data"->'info'->>'submitted' AS "submitted", "data"->'info'->>'reviewed' AS "reviewed", "data"->'info'->>'badges' AS "badges", "data"->'info'->>'disDate' AS "disDate"
      FROM "EhrCase"
      WHERE "userId" = ${userId} AND (COALESCE("data"->'info'->>'mode', '') = 'skill') = ${sk} ORDER BY "updatedAt" DESC LIMIT 100`;
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

export async function setReview(id: string, comment: string, score = ''): Promise<boolean> {
  try {
    const n = await prisma.$executeRaw`
      UPDATE "EhrCase" SET "data" = jsonb_set(jsonb_set(jsonb_set("data", '{info,comment}', to_jsonb(${comment}::text), true), '{info,profScore}', to_jsonb(${score}::text), true), '{info,reviewed}', to_jsonb(${new Date().toISOString()}::text), true)
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

// 교수 코멘트: 제출된 차트의 간호기록 한 줄에 붙인다
export async function setNoteFeedback(id: string, index: number, text: string): Promise<boolean> {
  if (!Number.isInteger(index) || index < 0 || index > 999) return false;
  try {
    const n = text
      ? await prisma.$executeRaw`
          UPDATE "EhrCase" SET "data" = jsonb_set("data", ARRAY['notes', ${String(index)}, 'fb']::text[], to_jsonb(${text}::text), true)
          WHERE "id" = ${id} AND "data"->'info'->>'submitted' IS NOT NULL AND jsonb_array_length(COALESCE("data"->'notes', '[]'::jsonb)) > ${index}`
      : await prisma.$executeRaw`
          UPDATE "EhrCase" SET "data" = "data" #- ARRAY['notes', ${String(index)}, 'fb']::text[]
          WHERE "id" = ${id} AND "data"->'info'->>'submitted' IS NOT NULL`;
    return n > 0;
  } catch {
    return false;
  }
}

// 같은 병상(또는 같은 샘플)에 이미 입원 중인 차트가 있으면 그 id
export async function findActiveDuplicate(userId: string, info: Record<string, unknown> | undefined): Promise<string | null> {
  const ward = typeof info?.ward === 'string' ? info.ward : '';
  const bed = typeof info?.bed === 'string' ? info.bed : '';
  const key = typeof info?.sampleKey === 'string' ? info.sampleKey : '';
  if (info?.mode === 'skill') return null;
  if (!(ward && bed) && !key) return null;
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "EhrCase"
      WHERE "userId" = ${userId} AND COALESCE("data"->'info'->>'discharged', '') = '' AND COALESCE("data"->'info'->>'mode', '') <> 'skill'
        AND ((${ward} <> '' AND ${bed} <> '' AND "data"->'info'->>'ward' = ${ward} AND "data"->'info'->>'bed' = ${bed})
          OR (${key} <> '' AND "data"->'info'->>'sampleKey' = ${key}))
      ORDER BY "updatedAt" DESC LIMIT 1`;
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

// 병동 전체 할 일 목록용: 진행 중인 차트의 처방만 가져온다
export async function ordersByCase(userId: string, mode: EhrMode = 'free'): Promise<Record<string, unknown[]>> {
  const sk = mode === 'skill';
  try {
    const rows = await prisma.$queryRaw<{ id: string; orders: unknown }[]>`
      SELECT "id", "data"->'orders' AS "orders" FROM "EhrCase"
      WHERE "userId" = ${userId} AND COALESCE("data"->'info'->>'discharged', '') = '' AND (COALESCE("data"->'info'->>'mode', '') = 'skill') = ${sk}`;
    return Object.fromEntries(rows.map(r => [r.id, Array.isArray(r.orders) ? r.orders : []]));
  } catch {
    return {};
  }
}

// 옛날 버전으로 저장된 미제출 샘플 차트와 같은 병상·샘플의 중복 차트를 정리한다.
// (샘플 환자는 목록에서 최신 데이터로 다시 열린다. 제출·퇴원한 차트는 건드리지 않는다.)
export async function cleanupCases(userId: string, ver: string): Promise<number> {
  try {
    const n = await prisma.$executeRaw`
      DELETE FROM "EhrCase"
      WHERE "userId" = ${userId} AND "data"->'info'->>'submitted' IS NULL AND COALESCE("data"->'info'->>'discharged', '') = '' AND COALESCE("data"->'info'->>'mode', '') <> 'skill'
        AND COALESCE("data"->'info'->>'sampleKey', '') <> '' AND COALESCE("data"->'info'->>'sampleKey', '') NOT LIKE 'v:%'
        AND COALESCE("data"->'info'->>'dataVer', '') <> ${ver}`;
    const m = await prisma.$executeRaw`
      DELETE FROM "EhrCase" c USING "EhrCase" k
      WHERE c."userId" = ${userId} AND k."userId" = ${userId} AND c."id" <> k."id"
        AND COALESCE(c."data"->'info'->>'mode', '') <> 'skill' AND COALESCE(k."data"->'info'->>'mode', '') <> 'skill'
        AND c."data"->'info'->>'submitted' IS NULL AND k."data"->'info'->>'submitted' IS NULL
        AND COALESCE(c."data"->'info'->>'discharged', '') = '' AND COALESCE(k."data"->'info'->>'discharged', '') = ''
        AND ((COALESCE(c."data"->'info'->>'sampleKey', '') <> '' AND c."data"->'info'->>'sampleKey' = k."data"->'info'->>'sampleKey')
          OR (COALESCE(c."data"->'info'->>'bed', '') <> '' AND c."data"->'info'->>'ward' = k."data"->'info'->>'ward' AND c."data"->'info'->>'bed' = k."data"->'info'->>'bed'))
        AND (c."updatedAt", c."id") < (k."updatedAt", k."id")`;
    return Number(n) + Number(m);
  } catch {
    return 0;
  }
}

// ---- 핵심술기 수행평가(시험용 공용 계정) ----
export async function findExamAttempt(userId: string, scnId: string, no: string): Promise<{ id: string; name: string } | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string | null }>>`
      SELECT "id", "data"->'info'->>'examName' AS "name" FROM "EhrCase"
      WHERE "userId" = ${userId} AND "data"->'info'->>'examNo' = ${no} AND COALESCE("data"->'info'->>'skScn', '') = ${scnId}
      ORDER BY "updatedAt" DESC LIMIT 1`;
    return rows[0] ? { id: rows[0].id, name: rows[0].name || '' } : null;
  } catch {
    return null;
  }
}

export type ExamRow = { id: string; title: string; examNo: string | null; examName: string | null; scn: string | null; score: string | null; submitted: string | null; updatedAt: Date };
export async function listExamCases(): Promise<ExamRow[]> {
  try {
    return await prisma.$queryRaw<ExamRow[]>`
      SELECT "id", "title", "data"->'info'->>'examNo' AS "examNo", "data"->'info'->>'examName' AS "examName", "data"->'info'->>'skScn' AS "scn",
        "data"->'info'->>'profScore' AS "score", "data"->'info'->>'submitted' AS "submitted", "updatedAt"
      FROM "EhrCase" WHERE "data"->'info'->>'examNo' IS NOT NULL ORDER BY "updatedAt" DESC LIMIT 500`;
  } catch {
    return [];
  }
}
