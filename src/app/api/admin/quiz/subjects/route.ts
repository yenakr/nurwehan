import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/auth-core';
import { setSubjectLevel, renameSubjectLevel } from '@/lib/access';

const GRADES = ['1학년', '2학년', '3학년', '4학년'];

// 과목 이름 변경 및/또는 구분(학년) 변경
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { subject, newSubject, grade, level } = await req.json();
    if (!subject) return NextResponse.json({ error: '과목이 필요합니다.' }, { status: 400 });
    if (grade !== undefined && !GRADES.includes(grade)) {
      return NextResponse.json({ error: '구분은 1~4학년 중 하나여야 합니다.' }, { status: 400 });
    }
    if (level !== undefined && !isSuperAdmin(user.role)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    if (level !== undefined && !['NORMAL', 'PARTIAL', 'PRIVATE'].includes(level)) {
      return NextResponse.json({ error: '공개 범위 값이 올바르지 않습니다.' }, { status: 400 });
    }
    const nextName = typeof newSubject === 'string' ? newSubject.trim() : '';
    const renaming = nextName && nextName !== subject;

    if (renaming) {
      const clash = await prisma.nursingTerm.count({ where: { subject: nextName } });
      if (clash > 0) {
        return NextResponse.json({ error: '이미 같은 이름의 과목이 있습니다.' }, { status: 409 });
      }
    }

    const data: { subject?: string; grade?: string } = {};
    if (renaming) data.subject = nextName;
    if (grade) data.grade = grade;
    if (Object.keys(data).length === 0 && level === undefined) return NextResponse.json({ success: true });

    const result = Object.keys(data).length > 0
      ? await prisma.nursingTerm.updateMany({ where: { subject }, data })
      : { count: 0 };
    if (renaming) {
      await prisma.quizAttempt.updateMany({ where: { subject }, data: { subject: nextName } });
      await renameSubjectLevel(subject, nextName);
    }
    if (level !== undefined) {
      await setSubjectLevel(renaming ? nextName : subject, level === 'NORMAL' ? null : level);
    }
    return NextResponse.json({ success: true, updated: result.count });
  } catch {
    return NextResponse.json({ error: '과목 수정 실패' }, { status: 500 });
  }
}
