import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { participantId, attendanceStatus, cleanupBad } = body;

    if (!participantId) {
      return NextResponse.json({ message: '대상 학생 ID가 필요합니다.' }, { status: 400 });
    }

    const updated = await prisma.applicationParticipant.update({
      where: { id: participantId },
      data: {
        ...(attendanceStatus !== undefined && { attendanceStatus }),
        ...(cleanupBad !== undefined && { cleanupBad })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
