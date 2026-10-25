import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim().slice(0, 200);
  const content = String(body.content ?? '').trim().slice(0, 20000);
  if (!title || !content) {
    return NextResponse.json({ message: '제목과 내용을 입력해 주세요.' }, { status: 400 });
  }
  const notice = await prisma.notice.create({
    data: { title, content, isPinned: !!body.isPinned, createdById: user.id },
  });
  return NextResponse.json(notice);
}
