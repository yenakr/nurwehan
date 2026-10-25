import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: { title?: string; content?: string; isPinned?: boolean } = {};
  if (typeof body.title === 'string') {
    const t = body.title.trim().slice(0, 200);
    if (!t) return NextResponse.json({ message: '제목을 입력해 주세요.' }, { status: 400 });
    data.title = t;
  }
  if (typeof body.content === 'string') {
    const c = body.content.trim().slice(0, 20000);
    if (!c) return NextResponse.json({ message: '내용을 입력해 주세요.' }, { status: 400 });
    data.content = c;
  }
  if (typeof body.isPinned === 'boolean') data.isPinned = body.isPinned;
  try {
    const notice = await prisma.notice.update({ where: { id }, data });
    return NextResponse.json(notice);
  } catch {
    return NextResponse.json({ message: '공지를 찾을 수 없어요.' }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.notice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: '공지를 찾을 수 없어요.' }, { status: 404 });
  }
}
