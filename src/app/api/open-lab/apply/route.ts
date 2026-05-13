import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function POST(request: Request) {
  // TODO: Get user from session (Mocking for now)
  const user = { id: 'some-user-id', studentId: '2023000001', grade: 2 };

  try {
    const body = await request.json();
    const { slotId, skillIds, participants, additionalRequest } = body;

    // 1. Basic Validation
    if (!slotId || !skillIds || skillIds.length === 0 || !participants || participants.length === 0) {
      return NextResponse.json({ message: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
    }

    if (skillIds.length > 2) {
      return NextResponse.json({ message: '한 타임에는 최대 2개 술기까지 신청할 수 있습니다.' }, { status: 400 });
    }

    // 2. Fetch Slot and Validate Capacity
    const slot = await prisma.openLabSlot.findUnique({
      where: { id: slotId },
      include: {
        applications: {
          where: { status: { in: ['PENDING', 'APPROVED'] } },
          include: { participants: true }
        }
      }
    });

    if (!slot) return NextResponse.json({ message: '존재하지 않는 일정입니다.' }, { status: 404 });
    if (slot.allowedGrade !== user.grade) return NextResponse.json({ message: '신청 가능한 학년이 아닙니다.' }, { status: 403 });

    const currentParticipantsCount = slot.applications.reduce((acc, app) => acc + app.participants.length, 0);
    if (currentParticipantsCount + participants.length > slot.maxCapacity) {
      return NextResponse.json({ message: '잔여 인원이 부족합니다.' }, { status: 400 });
    }

    // 3. Validate Participants Eligibility
    const participantStudentIds = participants.map((p: any) => p.studentId);
    
    // 3a. Check for active restrictions
    const activeRestrictions = await prisma.restriction.findMany({
      where: {
        studentId: { in: participantStudentIds },
        isActive: true,
        endDate: { gte: new Date() }
      }
    });

    if (activeRestrictions.length > 0) {
      const restrictedNames = activeRestrictions.map(r => r.studentName).join(', ');
      return NextResponse.json({ message: `신청 제한 상태인 학생이 포함되어 있습니다: ${restrictedNames}` }, { status: 400 });
    }

    // 3b. Check for duplicate application in the same week
    const weekStart = startOfWeek(slot.date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(slot.date, { weekStartsOn: 1 });

    const existingAppsInWeek = await prisma.application.findFirst({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        slot: { date: { gte: weekStart, lte: weekEnd } },
        participants: {
          some: { studentId: { in: participantStudentIds } }
        }
      },
      include: { participants: true }
    });

    if (existingAppsInWeek) {
      return NextResponse.json({ message: '참여자 중 해당 주에 이미 신청 이력이 있는 학생이 있습니다.' }, { status: 400 });
    }

    // 4. Create Application
    const application = await prisma.application.create({
      data: {
        slotId,
        representativeUserId: user.id,
        status: 'PENDING',
        additionalRequest,
        skills: {
          create: skillIds.map((skillId: string) => ({ skillId }))
        },
        participants: {
          create: participants.map((p: any) => ({
            studentId: p.studentId,
            name: p.name,
            // Try to link user_id if already registered
            userId: null // In real app, look up user by studentId
          }))
        }
      }
    });

    return NextResponse.json({ message: '신청이 완료되었습니다.', id: application.id });

  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
