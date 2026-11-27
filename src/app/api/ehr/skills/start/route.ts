import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { hasEhrAccess } from '@/lib/ehr-access';
import { createCase } from '@/lib/ehr';
import { buildChart } from '@/app/ehr/skills/scn';
import { resolveScn } from '@/lib/ehr-skill';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(await hasEhrAccess(user))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const sc = await resolveScn(String(b?.key || ''), user.id, isAdminRole(user.role));
  const built = sc && buildChart(sc.skill, sc.cfg);
  if (!sc || !built) return NextResponse.json({ error: 'bad' }, { status: 400 });
  built.data.info.sampleKey = `sk:${sc.skill}:${sc.scnId || 'def'}`;
  if (sc.exam) built.data.info.skExam = '1';
  if (sc.scnId) built.data.info.skScn = sc.scnId;
  const id = await createCase(user.id, sc.exam ? `[시험] ${sc.title} · ${sc.cfg.name}` : built.title, '핵심술기', built.data);
  return id ? NextResponse.json({ id }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
