import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { setComment } from '@/lib/ehr';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 1500) : '';
  const ok = await setComment((await params).id, comment);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 409 });
}
