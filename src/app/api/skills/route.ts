import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      where: { isActive: true },
      include: {
        supplies: true
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(skills);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching skills' }, { status: 500 });
  }
}
