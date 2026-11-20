import { randomUUID } from 'crypto';
import { prisma } from './prisma';

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const arr = <T,>(v: unknown, n: number): T[] => (Array.isArray(v) ? (v.slice(0, n) as T[]) : []);
const hm = (v: unknown) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : '');

// ---- AI가 만든 가상 사례 ----
export type Scenario = {
  patient: { age: string; sex: string; dx: string; cc: string; history: string; allergy: string; day: string };
  vitals: { t: string; sbp: string; dbp: string; hr: string; rr: string; bt: string; spo2: string }[];
  io: { t: string; inn: string; out: string }[];
  orders: { drug: string; dose: string; route: string; freq: string }[];
  labs: { name: string; value: string; ref: string }[];
  situation: string;
};

export function cleanScenario(raw: unknown): { title: string; scenario: Scenario } | null {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const p = r.patient || {};
  const title = s(r.title, 60);
  const situation = s(r.situation, 900);
  if (!title || !situation) return null;
  return {
    title,
    scenario: {
      patient: { age: s(p.age, 10), sex: s(p.sex, 10), dx: s(p.dx, 80), cc: s(p.cc, 160), history: s(p.history, 300), allergy: s(p.allergy, 80), day: s(p.day, 40) },
      vitals: arr<any>(r.vitals, 6).map(v => ({ t: hm(v?.t), sbp: s(v?.sbp, 4), dbp: s(v?.dbp, 4), hr: s(v?.hr, 4), rr: s(v?.rr, 4), bt: s(v?.bt, 5), spo2: s(v?.spo2, 4) })).filter(v => v.t),
      io: arr<any>(r.io, 6).map(v => ({ t: hm(v?.t), inn: s(v?.inn, 8), out: s(v?.out, 8) })).filter(v => v.t),
      orders: arr<any>(r.orders, 8).map(v => ({ drug: s(v?.drug, 60), dose: s(v?.dose, 30), route: s(v?.route, 20), freq: s(v?.freq, 30) })).filter(v => v.drug),
      labs: arr<any>(r.labs, 8).map(v => ({ name: s(v?.name, 30), value: s(v?.value, 20), ref: s(v?.ref, 30) })).filter(v => v.name),
      situation,
    },
  };
}

// ---- 학생이 쓰는 기록 ----
export type EhrData = {
  vitals: { id: string; t: string; sbp: string; dbp: string; hr: string; rr: string; bt: string; spo2: string }[];
  io: { id: string; t: string; inn: string; out: string }[];
  mar: Record<string, { done: boolean; t: string; note: string }>;
  notes: { id: string; t: string; fmt: 'N' | 'S' | 'D'; a: string; b: string; c: string; d: string }[];
  dx: { id: string; dx: string; goal: string; act: string; ev: string }[];
};

const id = (v: unknown) => (typeof v === 'string' && /^[\w-]{1,40}$/.test(v) ? v : randomUUID().slice(0, 8));

export function cleanData(raw: unknown): EhrData {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const mar: EhrData['mar'] = {};
  if (r.mar && typeof r.mar === 'object') {
    for (const [k, v] of Object.entries(r.mar as Record<string, any>).slice(0, 12)) {
      if (!/^\d{1,2}$/.test(k)) continue;
      mar[k] = { done: !!v?.done, t: hm(v?.t), note: s(v?.note, 200) };
    }
  }
  return {
    vitals: arr<any>(r.vitals, 30).map(v => ({ id: id(v?.id), t: hm(v?.t), sbp: s(v?.sbp, 4), dbp: s(v?.dbp, 4), hr: s(v?.hr, 4), rr: s(v?.rr, 4), bt: s(v?.bt, 5), spo2: s(v?.spo2, 4) })),
    io: arr<any>(r.io, 30).map(v => ({ id: id(v?.id), t: hm(v?.t), inn: s(v?.inn, 8), out: s(v?.out, 8) })),
    mar,
    notes: arr<any>(r.notes, 20).map(v => ({ id: id(v?.id), t: hm(v?.t), fmt: v?.fmt === 'S' || v?.fmt === 'D' ? v.fmt : 'N', a: s(v?.a, 800), b: s(v?.b, 800), c: s(v?.c, 800), d: s(v?.d, 800) })),
    dx: arr<any>(r.dx, 10).map(v => ({ id: id(v?.id), dx: s(v?.dx, 200), goal: s(v?.goal, 300), act: s(v?.act, 500), ev: s(v?.ev, 300) })),
  };
}

export type CaseRow = {
  id: string; userId: string; title: string; scenario: Scenario; data: EhrData; status: string;
  comment: string | null; reviewedAt: Date | null; submittedAt: Date | null; createdAt: Date; updatedAt: Date;
};

export async function listCases(userId: string) {
  try {
    return await prisma.$queryRaw<Array<{ id: string; title: string; status: string; reviewedAt: Date | null; updatedAt: Date }>>`
      SELECT "id", "title", "status", "reviewedAt", "updatedAt" FROM "EhrCase" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC LIMIT 50`;
  } catch { return []; }
}

export async function getCase(caseId: string): Promise<CaseRow | null> {
  try {
    const rows = await prisma.$queryRaw<CaseRow[]>`SELECT * FROM "EhrCase" WHERE "id" = ${caseId}`;
    return rows[0] ?? null;
  } catch { return null; }
}

export async function createCase(userId: string, title: string, scenario: Scenario): Promise<string | null> {
  const cid = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO "EhrCase" ("id", "userId", "title", "scenario") VALUES (${cid}, ${userId}, ${title}, ${JSON.stringify(scenario)}::jsonb)`;
    return cid;
  } catch { return null; }
}

export async function saveCaseData(caseId: string, userId: string, data: EhrData): Promise<boolean> {
  try {
    const n = await prisma.$executeRaw`
      UPDATE "EhrCase" SET "data" = ${JSON.stringify(data)}::jsonb, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${caseId} AND "userId" = ${userId} AND "status" = 'DRAFT'`;
    return n > 0;
  } catch { return false; }
}

export async function setSubmitted(caseId: string, userId: string, on: boolean): Promise<boolean> {
  try {
    const n = on
      ? await prisma.$executeRaw`UPDATE "EhrCase" SET "status" = 'SUBMITTED', "submittedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${caseId} AND "userId" = ${userId} AND "status" = 'DRAFT'`
      : await prisma.$executeRaw`UPDATE "EhrCase" SET "status" = 'DRAFT', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${caseId} AND "userId" = ${userId} AND "status" = 'SUBMITTED' AND "reviewedAt" IS NULL`;
    return n > 0;
  } catch { return false; }
}

export async function setComment(caseId: string, comment: string): Promise<boolean> {
  try {
    const n = await prisma.$executeRaw`UPDATE "EhrCase" SET "comment" = ${comment}, "reviewedAt" = CURRENT_TIMESTAMP WHERE "id" = ${caseId} AND "status" = 'SUBMITTED'`;
    return n > 0;
  } catch { return false; }
}

export async function listSubmitted() {
  try {
    return await prisma.$queryRaw<Array<{ id: string; userId: string; title: string; status: string; reviewedAt: Date | null; submittedAt: Date | null }>>`
      SELECT "id", "userId", "title", "status", "reviewedAt", "submittedAt" FROM "EhrCase" WHERE "status" = 'SUBMITTED' ORDER BY "submittedAt" DESC LIMIT 300`;
  } catch { return []; }
}
