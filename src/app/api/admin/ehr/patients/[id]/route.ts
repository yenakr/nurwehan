import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { patchVirtual, removeVirtual } from '@/lib/ehr-class';

const INFO = ['name', 'ageSex', 'ward', 'bed', 'dept', 'doctor', 'dx', 'cc', 'allergy'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const info: Record<string, string> = {};
  if (b.info && typeof b.info === 'object') for (const k of INFO) if (typeof b.info[k] === 'string') info[k] = b.info[k].slice(0, 200);
  const ok = await patchVirtual((await params).id, {
    ...(typeof b.published === 'boolean' && { published: b.published }),
    ...(b.classId !== undefined && { classId: typeof b.classId === 'string' && b.classId ? b.classId : null }),
    ...(Object.keys(info).length && { info }),
  });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return (await removeVirtual((await params).id)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
