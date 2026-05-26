import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfWeek, endOfWeek } from 'date-fns';
import { isWithinApplicationWindow } from '@/lib/application-window';

export async function POST(request: NextRequest) {
  const session = await getSession();
  const user = session?.user;

  try {
    const body = await request.json();
    const {
      ruleId,
      date,
      room,
      grade,
      skillIds,
      otherSkillName,
      participants,
      additionalRequest,
      confirmedNotice,
      subject,
      professor,
      purpose,
      guestName,
      guestStudentId,
      guestPhone,
      guestGrade,
      customStartTime,
      customEndTime
    } = body;

    // 1. Basic Validation
    if (!ruleId || !date || !room || !grade || !skillIds || skillIds.length === 0 || !participants || participants.length === 0) {
      return NextResponse.json({ message: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
    }

    if (!user) {
      if (!guestName || !guestStudentId || !guestPhone || !guestGrade) {
        return NextResponse.json({ message: '신청자 정보(이름, 학번, 연락처, 학년)를 모두 입력해주세요.' }, { status: 400 });
      }
    }

    // Bypass strict confirmedNotice requirement since it is checked automatically
    const isConfirmed = confirmedNotice !== undefined ? confirmedNotice : true;

    // 1.1 Application Window Check (Bypassed by request)
    const targetDate = new Date(date);

    if (skillIds.length > 2) {
      return NextResponse.json({ message: '한 타임에는 최대 2개 술기까지 신청할 수 있습니다.' }, { status: 400 });
    }

    // 2. Fetch Rule or handle Custom Slot
    let targetStartTime = '';
    let targetEndTime = '';
    let targetMaxCapacity = 20;
    let targetSemesterId = '';

    if (ruleId === 'custom') {
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true }
      });
      if (!activeSemester) {
        return NextResponse.json({ message: '활성화된 학기가 존재하지 않습니다. 관리자에게 문의해 주세요.' }, { status: 400 });
      }
      targetSemesterId = activeSemester.id;
      if (!customStartTime || !customEndTime) {
        return NextResponse.json({ message: '대체일정의 시작 시간과 종료 시간을 입력해주세요.' }, { status: 400 });
      }
      targetStartTime = customStartTime;
      targetEndTime = customEndTime;
    } else {
      const rule = await prisma.openLabGradeRule.findUnique({
        where: { id: ruleId }
      });
      if (!rule) return NextResponse.json({ message: '유효하지 않은 운영시간입니다.' }, { status: 404 });
      targetStartTime = rule.startTime;
      targetEndTime = rule.endTime;
      targetMaxCapacity = rule.maxCapacity;
      targetSemesterId = rule.semesterId;
    }

    targetDate.setHours(0, 0, 0, 0);

    // 3. Find or Create Slot
    let slot = await prisma.openLabSlot.findFirst({
      where: {
        date: targetDate,
        startTime: targetStartTime,
        endTime: targetEndTime,
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
          semesterId: targetSemesterId,
          allowedGrade: grade,
          date: targetDate,
          startTime: targetStartTime,
          endTime: targetEndTime,
          room: room,
          maxCapacity: targetMaxCapacity,
        },
        include: {
          applications: {
            where: { status: { in: ['PENDING', 'APPROVED'] } },
            include: { participants: true }
          }
        }
      });
    }

    // 4. Validate Capacity (Bypassed by request)

    // 5. Validate Participants Eligibility (only for actual 8-10 digit student IDs)
    const participantStudentIds = Array.from(new Set([
      ...participants.map((p: { studentId: string }) => p.studentId),
      ...(user ? [] : [guestStudentId])
    ].filter(id => id && /^\d{8,10}$/.test(id))));
    
    // Check for active restrictions (Bypassed by request)

    // Check for duplicate application in the same week (Bypassed by request)

    // Filter out 'other' skill ID for actual DB skills
    const actualSkillIds = skillIds.filter((id: string) => id !== 'other');

    // 6. Create Application
    const application = await prisma.application.create({
      data: {
        slotId: slot.id,
        representativeUserId: user?.id || null,
        status: 'APPROVED',
        selectedGrade: grade,
        subject: subject || null,
        professor: professor || null,
        purpose: purpose || null,
        guestName: user ? null : guestName,
        guestStudentId: user ? null : guestStudentId,
        guestPhone: user ? null : guestPhone,
        guestGrade: user ? null : parseInt(guestGrade.toString()),
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
