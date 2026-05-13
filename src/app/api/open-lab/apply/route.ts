import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }
  const user = session.user;

  try {
    const body = await request.json();
    const { ruleId, date, room, grade, skillIds, otherSkillName, participants, additionalRequest, confirmedNotice } = body;

    // 1. Basic Validation
    if (!ruleId || !date || !room || !grade || !skillIds || skillIds.length === 0 || !participants || participants.length === 0) {
      return NextResponse.json({ message: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
    }

    if (!confirmedNotice) {
      return NextResponse.json({ message: '이용 안내 및 유의사항 확인이 필요합니다.' }, { status: 400 });
    }

    if (skillIds.length > 2) {
      return NextResponse.json({ message: '한 타임에는 최대 2개 술기까지 신청할 수 있습니다.' }, { status: 400 });
    }

    // 2. Fetch Rule
    const rule = await prisma.openLabGradeRule.findUnique({
      where: { id: ruleId }
    });
    if (!rule) return NextResponse.json({ message: '유효하지 않은 운영시간입니다.' }, { status: 404 });

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // 3. Find or Create Slot
    let slot = await prisma.openLabSlot.findFirst({
      where: {
        date: targetDate,
        startTime: rule.startTime,
        endTime: rule.endTime,
        room: room,
        allowedGrade: grade
      },
      include: {
        applications: {
          where: { status: { in: ['PENDING', 'APPROVED'] } },
          include: { participants: true }
        }
      }
    });

    if (!slot) {
      slot = await prisma.openLabSlot.create({
        data: {
          semesterId: rule.semesterId,
          allowedGrade: grade,
          date: targetDate,
          startTime: rule.startTime,
          endTime: rule.endTime,
          room: room,
          maxCapacity: rule.maxCapacity,
        },
        include: {
          applications: {
            where: { status: { in: ['PENDING', 'APPROVED'] } },
            include: { participants: true }
          }
        }
      });
    }

    // 4. Validate Capacity
    const currentParticipantsCount = slot.applications?.reduce((acc, app) => acc + app.participants.length, 0) || 0;
    if (currentParticipantsCount + participants.length > slot.maxCapacity) {
      return NextResponse.json({ message: '잔여 인원이 부족합니다.' }, { status: 400 });
    }

    // 5. Validate Participants Eligibility
    const participantStudentIds = participants.map((p: { studentId: string }) => p.studentId);
    
    // Check for active restrictions
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

    // Check for duplicate application in the same week
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    const existingAppsInWeek = await prisma.application.findFirst({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        slot: { date: { gte: weekStart, lte: weekEnd } },
        participants: {
          some: { studentId: { in: participantStudentIds } }
        }
      }
    });

    if (existingAppsInWeek) {
      return NextResponse.json({ message: '참여자 중 해당 주에 이미 신청 이력이 있는 학생이 있습니다.' }, { status: 400 });
    }

    // Filter out 'other' skill ID for actual DB skills
    const actualSkillIds = skillIds.filter((id: string) => id !== 'other');

    // 6. Create Application
    const application = await prisma.application.create({
      data: {
        slotId: slot.id,
        representativeUserId: user.id,
        status: 'PENDING',
        selectedGrade: grade,
        additionalRequest,
        otherSkillName: otherSkillName || null,
        confirmedNotice: true,
        skills: {
          create: actualSkillIds.map((skillId: string) => ({ skillId }))
        },
        participants: {
          create: participants.map((p: { studentId: string; name: string }) => ({
            studentId: p.studentId,
            name: p.name
          }))
        }
      }
    });

    return NextResponse.json({ message: '신청이 완료되었습니다.', id: application.id });

  } catch (error) {
    console.error('Submit application error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
