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
      
      const participants = await prisma.applicationParticipant.findMany({
        where: { applicationId }
      });
      
      for (const p of participants) {
        if (cleanupAll) {
          await addCleanupWarning(p, applicationId, user.id);
        } else {
          await removeCleanupWarning(p, applicationId);
        }
      }
      
      return NextResponse.json({ success: true });
    }

    if (!participantId) {
      return NextResponse.json({ message: '대상 학생 ID가 필요합니다.' }, { status: 400 });
    }

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

    // 1. Attendance Status Change
    if (attendanceStatus === 'ABSENT' && current.attendanceStatus !== 'ABSENT') {
      await createAbsenceRestriction(updated, current.application.slot.date, user.id);
    } else if ((attendanceStatus === 'PRESENT' || attendanceStatus === 'PENDING') && current.attendanceStatus === 'ABSENT') {
      await removeAbsenceRestriction(updated);
    }

    // 2. Cleanup Status Change
    if (cleanupBad === true && current.cleanupBad === false) {
      await addCleanupWarning(updated, updated.applicationId, user.id);
    } else if (cleanupBad === false && current.cleanupBad === true) {
      await removeCleanupWarning(updated, updated.applicationId);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function createAbsenceRestriction(participant: any, labDate: Date, adminId: string) {
  const existing = await prisma.restriction.findFirst({
    where: {
      studentId: participant.studentId,
      sourceApplicationId: participant.applicationId,
      reason: { contains: '불참' }
    }
  });

  if (existing) return;

  const startDate = new Date(labDate);
  const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  await prisma.restriction.create({
    data: {
      userId: participant.userId,
      studentId: participant.studentId,
      studentName: participant.name,
      reason: 'OPEN LAB 불참 (2주 제한)',
      sourceApplicationId: participant.applicationId,
      startDate,
      endDate,
      isActive: true,
      createdById: adminId
    }
  });
}

async function removeAbsenceRestriction(participant: any) {
  await prisma.restriction.deleteMany({
    where: {
      studentId: participant.studentId,
      sourceApplicationId: participant.applicationId,
      reason: { contains: '불참' }
    }
  });
}

async function addCleanupWarning(participant: any, applicationId: string, adminId: string) {
  const existing = await prisma.cleanupWarning.findFirst({
    where: { 
      studentId: participant.studentId,
      applicationId: applicationId
    }
  });

  if (existing) return;

  const count = await prisma.cleanupWarning.count({
    where: { studentId: participant.studentId }
  });

  await prisma.cleanupWarning.create({
    data: {
      userId: participant.userId,
      studentId: participant.studentId,
      studentName: participant.name,
      applicationId: applicationId,
      reason: 'OPEN LAB 정리 불량',
      warningCountAfter: count + 1,
      createdById: adminId
    }
  });

  await checkAndApplyPermanentCleanupRestriction(participant.studentId, participant.name, participant.userId, adminId);
}

async function removeCleanupWarning(participant: any, applicationId: string) {
  await prisma.cleanupWarning.deleteMany({
    where: {
      studentId: participant.studentId,
      applicationId: applicationId
    }
  });

  // Re-check permanent restriction
  await checkAndApplyPermanentCleanupRestriction(participant.studentId, participant.name, participant.userId, '');
}

async function checkAndApplyPermanentCleanupRestriction(studentId: string, name: string, userId: string | null, adminId: string) {
  const count = await prisma.cleanupWarning.count({
    where: { studentId }
  });

  if (count >= 3) {
    const existing = await prisma.restriction.findFirst({
      where: {
        studentId,
        reason: { contains: '정리 불량 3회' },
        isActive: true
      }
    });

    if (!existing && adminId) {
      await prisma.restriction.create({
        data: {
          userId,
          studentId,
          studentName: name,
          reason: '정리 불량 3회 누적 (영구 제한)',
          startDate: new Date(),
          endDate: new Date('9999-12-31'),
          isActive: true,
          createdById: adminId
        }
      });
    }
  } else {
    // If count < 3, deactivate any permanent cleanup restrictions
    await prisma.restriction.updateMany({
      where: {
        studentId,
        reason: { contains: '정리 불량 3회' },
        isActive: true
      },
      data: { isActive: false }
    });
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
