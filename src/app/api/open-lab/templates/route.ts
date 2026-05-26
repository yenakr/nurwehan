import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        representativeUserId: session.user.id,
        status: { in: ['APPROVED', 'COMPLETED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        skills: { include: { skill: true } },
        participants: true
      }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Fetch templates error:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
