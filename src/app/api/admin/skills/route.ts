import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

// GET /api/admin/skills - Fetch all skills for management
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const skills = await prisma.skill.findMany({
      include: { supplies: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(skills);
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

// POST /api/admin/skills - Create new skill
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const { name, isActive } = await request.json();
    
    const skill = await prisma.skill.create({
      data: {
        name,
        isActive: isActive ?? true,
      },
      include: { supplies: true }
    });

    return NextResponse.json(skill);
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
