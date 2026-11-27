import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { listSkillScns, saveSkillScn, patchVirtual, removeVirtual } from '@/lib/ehr-class';
import { cleanCfg } from '@/app/ehr/skills/scn';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const cur = (await listSkillScns()).find(x => x.id === id);
  if (!cur) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const data = {
    kind: 'skill-scn' as const, skill: cur.data.skill,
    title: typeof b.title === 'string' && b.title.trim() ? b.title.trim().slice(0, 60) : cur.data.title,
    cfg: cleanCfg(b.cfg, cur.data.skill), exam: !!b.exam, assign: b.assign === 'random' ? ('random' as const) : ('same' as const),
  };
  const ok = (await saveSkillScn(id, data))
    && (await patchVirtual(id, { ...(typeof b.published === 'boolean' && { published: b.published }), ...(b.classId !== undefined && { classId: typeof b.classId === 'string' && b.classId ? b.classId : null }) }));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return (await removeVirtual((await params).id)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
