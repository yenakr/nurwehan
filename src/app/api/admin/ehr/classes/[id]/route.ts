import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { removeClass, setMember, updateClass } from '@/lib/ehr-class';

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (typeof b.member === 'string') {
    const ok = await setMember(id, b.member, b.on !== false);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
  }
  const c = { year: s(b.year, 4).replace(/\D/g, ''), term: s(b.term, 10), subject: s(b.subject, 40), grade: s(b.grade, 2), section: s(b.section, 10), professor: s(b.professor, 20) };
  if (!c.year || !c.subject) return NextResponse.json({ error: 'bad' }, { status: 400 });
  return (await updateClass(id, c)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return (await removeClass((await params).id)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
