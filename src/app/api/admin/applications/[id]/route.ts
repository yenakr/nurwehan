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
    const { status, rejectedReason, cancelReason } = body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        status,
        rejectedReason: status === 'REJECTED' ? (rejectedReason || null) : undefined,
        cancelReason: status === 'CANCELLED' ? (cancelReason || null) : undefined,
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        approvedById: status === 'APPROVED' ? user.id : undefined,
      }
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const { id } = await context.params;

    // Explicitly delete relations first if not cascading
    await prisma.applicationSkill.deleteMany({ where: { applicationId: id } });
    await prisma.applicationParticipant.deleteMany({ where: { applicationId: id } });
    await prisma.usageLog.deleteMany({ where: { applicationId: id } });
    
    await prisma.application.delete({
      where: { id }
    });

    return NextResponse.json({ message: '신청 내역이 완전히 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json({ message: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
