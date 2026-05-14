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

    const updatedUser = await prisma.user.update({
      where: { id },
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
