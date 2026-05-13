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
    const { participantId, applicationId, attendanceStatus, cleanupBad, cleanupAll } = body;

    // Handle Group Cleanup Update
    if (applicationId && cleanupAll !== undefined) {
      await prisma.applicationParticipant.updateMany({
        where: { applicationId },
        data: { cleanupBad: cleanupAll }
      });
      
      // If setting group cleanup as bad, create warnings for all
      if (cleanupAll) {
        const participants = await prisma.applicationParticipant.findMany({
          where: { applicationId }
        });
        
        for (const p of participants) {
          await createCleanupWarning(p, applicationId, user.id);
        }
      }
      
      return NextResponse.json({ success: true });
    }

    if (!participantId) {
      return NextResponse.json({ message: '대상 학생 ID가 필요합니다.' }, { status: 400 });
    }

    // Get current state to check for changes
    const current = await prisma.applicationParticipant.findUnique({
      where: { id: participantId },
      include: { application: true }
    });

    if (!current) {
      return NextResponse.json({ message: '참가자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updated = await prisma.applicationParticipant.update({
      where: { id: participantId },
      data: {
        ...(attendanceStatus !== undefined && { attendanceStatus }),
        ...(cleanupBad !== undefined && { cleanupBad })
      }
    });

    // Restriction Logic for Attendance
    if (attendanceStatus === 'ABSENT' || attendanceStatus === 'LATE_30') {
      const now = new Date();
      const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
      
      await prisma.restriction.create({
        data: {
          userId: updated.userId,
          studentId: updated.studentId,
          studentName: updated.name,
          reason: attendanceStatus === 'ABSENT' ? 'OPEN LAB 불참 (2주 제한)' : 'OPEN LAB 30분 이상 지각 (2주 제한)',
          sourceApplicationId: updated.applicationId,
          startDate: now,
          endDate: endDate,
          createdById: user.id
        }
      });
    }

    // Warning Logic for Cleanup
    if (cleanupBad === true && current.cleanupBad === false) {
      await createCleanupWarning(updated, updated.applicationId, user.id);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function createCleanupWarning(participant: any, applicationId: string, adminId: string) {
  // Count existing warnings
  const warningCount = await prisma.cleanupWarning.count({
    where: { studentId: participant.studentId }
  });

  const newCount = warningCount + 1;

  await prisma.cleanupWarning.create({
    data: {
      userId: participant.userId,
      studentId: participant.studentId,
      studentName: participant.name,
      applicationId: applicationId,
      reason: 'OPEN LAB 정리 불량',
      warningCountAfter: newCount,
      createdById: adminId
    }
  });

  // If 3 warnings, create restriction
  if (newCount >= 3) {
    const now = new Date();
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
    
    await prisma.restriction.create({
      data: {
        userId: participant.userId,
        studentId: participant.studentId,
        studentName: participant.name,
        reason: '정리 불량 3회 누적 (2주 제한)',
        startDate: now,
        endDate: endDate,
        createdById: adminId
      }
    });
  }
}
