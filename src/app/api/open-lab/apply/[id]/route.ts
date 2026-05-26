import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isWithinApplicationWindow } from '@/lib/application-window';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await context.params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        slot: true,
        skills: true,
        participants: true
      }
    });

    if (!application) {
      return NextResponse.json({ message: '신청 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (application.representativeUserId !== session.user.id) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { ruleId, date, room, grade, skillIds, otherSkillName, additionalRequest, confirmedNotice } = body;

    // 1. Fetch current application
    const application = await prisma.application.findUnique({
      where: { id },
      include: { slot: true }
    });

    if (!application) {
      return NextResponse.json({ message: '신청 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (application.representativeUserId !== session.user.id) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    if (application.status !== 'PENDING' && application.status !== 'APPROVED') {
      return NextResponse.json({ message: '수정할 수 있는 상태가 아닙니다.' }, { status: 400 });
    }

    // 2. Validate Window
    const targetDate = new Date(date);
    if (!isWithinApplicationWindow(targetDate)) {
      return NextResponse.json({ message: '현재 신청 가능 기간이 아닙니다.' }, { status: 400 });
    }

    // 2.1 Weekly Duplicate Check (Excluding current application)
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    const existingAppsInWeek = await prisma.application.findFirst({
      where: {
        id: { not: id },
        status: { in: ['PENDING', 'APPROVED'] },
        slot: { date: { gte: weekStart, lte: weekEnd } },
        participants: {
          some: { studentId: session.user.studentId }
        }
      }
    });

    if (existingAppsInWeek) {
      return NextResponse.json({ message: '해당 주에 이미 다른 신청 이력이 있습니다.' }, { status: 400 });
    }

    // 3. Find/Create Slot (Simplified for now, similar to apply route)
    const rule = await prisma.openLabGradeRule.findUnique({ where: { id: ruleId } });
    if (!rule) return NextResponse.json({ message: '유효하지 않은 운영시간입니다.' }, { status: 400 });

    const cleanDate = new Date(date);
    cleanDate.setHours(0,0,0,0);

    let slot = await prisma.openLabSlot.findFirst({
      where: {
        date: cleanDate,
        startTime: rule.startTime,
        endTime: rule.endTime,
        room,
        allowedGrade: grade
      }
    });

    if (!slot) {
      slot = await prisma.openLabSlot.create({
        data: {
          semesterId: rule.semesterId,
          allowedGrade: grade,
          date: cleanDate,
          startTime: rule.startTime,
          endTime: rule.endTime,
          room,
          maxCapacity: rule.maxCapacity
        }
      });
    }

    // 4. Update Application
    const updatedApplication = await prisma.$transaction(async (tx) => {
      // Delete old skills
      await tx.applicationSkill.deleteMany({ where: { applicationId: id } });
      
      // Update main application
      return await tx.application.update({
        where: { id },
        data: {
          slotId: slot.id,
          selectedGrade: grade,
          additionalRequest,
          otherSkillName: otherSkillName || null,
          confirmedNotice: true,
          skills: {
            create: skillIds.map((skillId: string) => ({ skillId: skillId === 'other' ? undefined : skillId })).filter((s: any) => s.skillId)
          }
        }
      });
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Existing DELETE logic...
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const { id } = await context.params;
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) return NextResponse.json({ message: '신청 내역 없음' }, { status: 404 });
    if (application.representativeUserId !== session.user.id) return NextResponse.json({ message: '권한 없음' }, { status: 403 });
    if (application.status !== 'PENDING' && application.status !== 'APPROVED') return NextResponse.json({ message: '대기 중이거나 승인 완료된 신청만 취소 가능' }, { status: 400 });
    
    await prisma.application.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() }
    });
    return NextResponse.json({ message: '취소되었습니다.' });
  } catch {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
