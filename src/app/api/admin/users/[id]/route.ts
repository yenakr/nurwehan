import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

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
    const { grade, approvalStatus, rejectedReason } = body;

    if (grade !== undefined && !(Number.isInteger(grade) && grade >= 1 && grade <= 4)) {
      return NextResponse.json({ message: '학년이 올바르지 않습니다.' }, { status: 400 });
    }
    if (approvalStatus !== undefined && !['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(approvalStatus)) {
      return NextResponse.json({ message: '상태 값이 올바르지 않습니다.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      // 비밀번호 해시 등은 응답에 포함하지 않는다
      select: { id: true, studentId: true, name: true, grade: true, approvalStatus: true },
      data: {
        ...(grade !== undefined && { grade }),
        ...(approvalStatus !== undefined && { approvalStatus }),
        ...(rejectedReason !== undefined && { rejectedReason })
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
