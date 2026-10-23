import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const MAX_LEN = 3000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 내 실습일지 목록 (최신순)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const notes = await prisma.clinicalNote.findMany({
      where: { userId: user.id },
      orderBy: [{ date: 'desc' }, { ward: 'asc' }],
      select: { id: true, date: true, ward: true, content: true },
    });
    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ notes: [], unavailable: true });
  }
}

// 날짜·병동별 저장 (내용이 비어 있으면 삭제)
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const date = String(body.date || '');
    const ward = String(body.ward || '').trim().slice(0, 60);
    const content = String(body.content || '').trim();
    if (!DATE_RE.test(date) || !ward) {
      return NextResponse.json({ error: '날짜와 병동이 필요합니다.' }, { status: 400 });
    }
    if (content.length > MAX_LEN) {
      return NextResponse.json({ error: `${MAX_LEN}자까지 저장할 수 있어요.` }, { status: 400 });
    }
    const key = { userId_date_ward: { userId: user.id, date, ward } };
    if (!content) {
      await prisma.clinicalNote.deleteMany({ where: { userId: user.id, date, ward } });
      return NextResponse.json({ success: true, deleted: true });
    }
    await prisma.clinicalNote.upsert({
      where: key,
      create: { userId: user.id, date, ward, content },
      update: { content },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '저장하지 못했어요.' }, { status: 500 });
  }
}
