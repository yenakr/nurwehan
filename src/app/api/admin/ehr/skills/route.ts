import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { SKILLS, defaultCfg } from '@/app/ehr/skills/scn';

// 기본 시나리오를 복제해 새 시나리오를 만든다 (비공개로 시작)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const sk = SKILLS.find(s => s.key === b?.skill);
  if (!sk) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const id = randomUUID();
  const data = { kind: 'skill-scn', skill: sk.key, title: `${sk.title} 시험`, cfg: defaultCfg(sk.key), exam: false, assign: 'same' };
  try {
    await prisma.$executeRaw`INSERT INTO "EhrVirtual" ("id", "classId", "published", "data") VALUES (${id}, NULL, false, ${JSON.stringify(data)}::jsonb)`;
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
