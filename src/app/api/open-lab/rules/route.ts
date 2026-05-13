import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');

  try {
    const rules = await prisma.openLabGradeRule.findMany({
      where: {
        grade: grade ? parseInt(grade) : undefined,
        isActive: true,
      },
      include: {
        semester: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching rules' }, { status: 500 });
  }
}
