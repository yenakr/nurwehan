import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { date, startTime, endTime, room, grade } = await request.json();

    if (!date || !startTime || !endTime || !room || !grade) {
      return NextResponse.json({ message: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Find applications for this slot
    const applications = await prisma.application.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        selectedGrade: grade,
        slot: {
          date: targetDate,
          startTime,
          endTime,
          room
        }
      },
      include: {
        participants: true
      }
    });

    const totalParticipants = applications.reduce((acc, app) => acc + app.participants.length, 0);

    // Find the rule to get maxCapacity
    const rule = await prisma.openLabGradeRule.findFirst({
      where: {
        grade,
        dayOfWeek: targetDate.getDay(),
        startTime,
        endTime
      }
    });

    const maxCapacity = rule?.maxCapacity || 16;
    const remaining = maxCapacity - totalParticipants;

    return NextResponse.json({
      totalParticipants,
      maxCapacity,
      remaining
    });
  } catch (error) {
    console.error('Check capacity error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
