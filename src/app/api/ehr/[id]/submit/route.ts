import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { submitCase } from '@/lib/ehr';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !(await hasEhrAccess(user))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ok = await submitCase(user.id, (await params).id, body?.on !== false);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 409 });
}
