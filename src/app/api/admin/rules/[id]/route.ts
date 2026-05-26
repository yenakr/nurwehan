import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { grade, dayOfWeek, startTime, endTime, room, maxCapacity, isActive } = body;

    const existingRule = await prisma.openLabGradeRule.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return NextResponse.json({ message: '운영시간을 찾을 수 없습니다.' }, { status: 404 });
    }

    const updatedRule = await prisma.openLabGradeRule.update({
      where: { id },
      data: {
        grade: grade !== undefined ? parseInt(grade.toString()) : undefined,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek.toString()) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        room: room || undefined,
        maxCapacity: maxCapacity !== undefined ? parseInt(maxCapacity.toString()) : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined
      }
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error('Error updating admin rule:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existingRule = await prisma.openLabGradeRule.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return NextResponse.json({ message: '운영시간을 찾을 수 없습니다.' }, { status: 404 });
    }

    await prisma.openLabGradeRule.delete({
      where: { id }
    });

    return NextResponse.json({ message: '성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting admin rule:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
