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
    const { status, cancelReason } = body;
    if (status !== 'CANCELLED') {
      return NextResponse.json({ message: '지원하지 않는 요청입니다.' }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        status,
        cancelReason: cancelReason || null,
        cancelledAt: new Date(),
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
