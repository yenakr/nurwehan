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
      include: { application: { include: { slot: true } } }
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

    // 1. Attendance Restriction Logic
    if (attendanceStatus === 'ABSENT') {
      // Check if restriction already exists for this student and application
      const existingRestriction = await prisma.restriction.findFirst({
        where: { 
          studentId: updated.studentId,
          sourceApplicationId: updated.applicationId,
          reason: { contains: '불참' }
        }
      });

      if (!existingRestriction) {
        // Lab date for the restriction start
        const labDate = new Date(current.application.slot.date);
        const endDate = new Date(labDate.getTime() + 14 * 24 * 60 * 60 * 1000); // Exactly 14 days later
        
        await prisma.restriction.create({
          data: {
            userId: updated.userId,
            studentId: updated.studentId,
            studentName: updated.name,
            reason: 'OPEN LAB 불참 (2주 제한)',
            sourceApplicationId: updated.applicationId,
            startDate: labDate,
            endDate: endDate,
            createdById: user.id
          }
        });
      }
    } else if (attendanceStatus === 'PRESENT' || attendanceStatus === 'PENDING') {
      // If changed back, remove the 'ABSENT' restriction for this specific application
      await prisma.restriction.deleteMany({
        where: {
          studentId: updated.studentId,
          sourceApplicationId: updated.applicationId,
          reason: { contains: '불참' }
        }
      });
    }

    // 2. Cleanup Warning Logic
    if (cleanupBad === true && current.cleanupBad === false) {
      await createCleanupWarning(updated, updated.applicationId, user.id);
    } else if (cleanupBad === false && current.cleanupBad === true) {
      // If changed to Good, remove the warning for this specific application
      // Note: This won't remove a restriction if it was already triggered, but it prevents count inflation.
      await prisma.cleanupWarning.deleteMany({
        where: {
          studentId: updated.studentId,
          applicationId: updated.applicationId
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function createCleanupWarning(participant: any, applicationId: string, adminId: string) {
  // Check if warning already exists for this application to prevent duplicates
  const existingWarning = await prisma.cleanupWarning.findFirst({
    where: { 
      studentId: participant.studentId,
      applicationId: applicationId
    }
  });

  if (existingWarning) return;

  // Count existing warnings (excluding current one since we haven't created it yet)
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
    // Check if restriction already exists for '3 warnings'
    const existingRestriction = await prisma.restriction.findFirst({
      where: {
        studentId: participant.studentId,
        reason: { contains: '정리 불량 3회' },
        isActive: true,
        endDate: { gte: new Date() }
      }
    });

    if (!existingRestriction) {
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
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ message: '날짜가 필요합니다.' }, { status: 400 });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const participants = await prisma.applicationParticipant.findMany({
      where: {
        application: {
          slot: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          status: { in: ['APPROVED', 'COMPLETED'] }
        }
      },
      include: {
        application: {
          include: {
            representativeUser: true,
            slot: true,
            skills: { include: { skill: true } },
            usageLogs: { select: { id: true } }
          }
        }
      },
      orderBy: {
        application: {
          submittedAt: 'asc'
        }
      }
    });

    return NextResponse.json(participants, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
