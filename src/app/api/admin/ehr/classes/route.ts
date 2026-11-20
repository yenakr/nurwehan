import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { createClass } from '@/lib/ehr-class';

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const c = { year: s(b.year, 4).replace(/\D/g, ''), term: s(b.term, 10), subject: s(b.subject, 40), grade: s(b.grade, 2), section: s(b.section, 10), professor: s(b.professor, 20) };
  if (!c.year || !c.subject) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const id = await createClass(c);
  return id ? NextResponse.json({ id }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
