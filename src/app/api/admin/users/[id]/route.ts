import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/auth-core';
import { setTier } from '@/lib/access';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { grade, approvalStatus, rejectedReason, tier, role } = body;

    if (grade !== undefined && !(Number.isInteger(grade) && grade >= 1 && grade <= 4)) {
      return NextResponse.json({ message: '학년이 올바르지 않습니다.' }, { status: 400 });
    }
    if (approvalStatus !== undefined && !['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(approvalStatus)) {
      return NextResponse.json({ message: '상태 값이 올바르지 않습니다.' }, { status: 400 });
    }

    if ((tier !== undefined || role !== undefined) && !isSuperAdmin(user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }
    if (role !== undefined && role !== 'STUDENT' && role !== 'ADMIN') {
      return NextResponse.json({ message: '값이 올바르지 않습니다.' }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    if (!isSuperAdmin(user.role) && isAdminRole(target.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }
    if (role !== undefined && target.role === 'SUPER_ADMIN') {
      return NextResponse.json({ message: '변경할 수 없습니다.' }, { status: 400 });
    }
    if (tier !== undefined && tier !== 0 && tier !== 1) {
      return NextResponse.json({ message: '값이 올바르지 않습니다.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      // 비밀번호 해시 등은 응답에 포함하지 않는다
      select: { id: true, studentId: true, name: true, grade: true, approvalStatus: true, role: true },
      data: {
        ...(grade !== undefined && { grade }),
        ...(approvalStatus !== undefined && { approvalStatus }),
        ...(rejectedReason !== undefined && { rejectedReason }),
        ...(role !== undefined && { role })
      }
    });

    if (tier !== undefined) await setTier(id, tier);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
