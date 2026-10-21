import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

// 과목 안에서 퀴즈 이름 변경
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { subject, category, newCategory } = await req.json();
    const next = typeof newCategory === 'string' ? newCategory.trim() : '';
    if (!subject || !category || !next) {
      return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 });
    }
    if (next === category) return NextResponse.json({ success: true });

    const clash = await prisma.nursingTerm.count({ where: { subject, category: next } });
    if (clash > 0) {
      return NextResponse.json({ error: '이 과목에 같은 이름의 퀴즈가 있습니다.' }, { status: 409 });
    }
    const result = await prisma.nursingTerm.updateMany({
      where: { subject, category },
      data: { category: next },
    });
    await prisma.quizAttempt.updateMany({ where: { subject, category }, data: { category: next } });
    return NextResponse.json({ success: true, updated: result.count });
  } catch {
    return NextResponse.json({ error: '퀴즈 이름 수정 실패' }, { status: 500 });
  }
}
