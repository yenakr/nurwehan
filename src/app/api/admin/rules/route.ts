import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }

  try {
    const rules = await prisma.openLabGradeRule.findMany({
      orderBy: [
        { grade: 'asc' },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching admin rules:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { grade, dayOfWeek, startTime, endTime, room, maxCapacity } = body;

    if (grade === undefined || dayOfWeek === undefined || !startTime || !endTime || !room || !maxCapacity) {
      return NextResponse.json({ message: '필수 정보를 모두 입력해주세요.' }, { status: 400 });
    }

    // Find active semester
    let semester = await prisma.semester.findFirst({
      where: { isActive: true }
    });

    // Fallback if no active semester
    if (!semester) {
      semester = await prisma.semester.findFirst({
        orderBy: { startDate: 'desc' }
      });
    }

    // If still no semester, create a default one
    if (!semester) {
      semester = await prisma.semester.create({
        data: {
          name: '2026학년도 2학기',
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-12-31'),
          isActive: true
        }
      });
    }

    const newRule = await prisma.openLabGradeRule.create({
      data: {
        semesterId: semester.id,
        grade: parseInt(grade.toString()),
        dayOfWeek: parseInt(dayOfWeek.toString()),
        startTime,
        endTime,
        room,
        maxCapacity: parseInt(maxCapacity.toString())
      }
    });

    return NextResponse.json(newRule);
  } catch (error) {
    console.error('Error creating admin rule:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
