import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { createCase, findActiveDuplicate } from '@/lib/ehr';

async function approvedUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await hasEhrAccess(user)) ? user : null;
}

export async function POST(req: Request) {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === 'string' ? body.title.slice(0, 100) : '새 차트';
  const subject = typeof body?.subject === 'string' ? body.subject.slice(0, 50) : null;
  const data = body?.data && typeof body.data === 'object' ? body.data : {};
  if (JSON.stringify(data).length > 400_000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  const dup = await findActiveDuplicate(user.id, (data as { info?: Record<string, unknown> }).info);
  if (dup) return NextResponse.json({ id: dup });
  const id = await createCase(user.id, title, subject, data);
  return id ? NextResponse.json({ id }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
