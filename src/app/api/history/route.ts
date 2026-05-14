import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(null);
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const applications = await prisma.application.findMany({
      where: { representativeUserId: session.user.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { 
        slot: true,
        skills: {
          include: { skill: true }
        }
      }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
