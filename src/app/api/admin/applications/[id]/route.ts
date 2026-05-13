import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, rejectedReason } = body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        status,
        rejectedReason: status === 'REJECTED' ? rejectedReason : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedById: status === 'APPROVED' ? user.id : null,
      }
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
