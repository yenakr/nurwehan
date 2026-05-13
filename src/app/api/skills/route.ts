import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(skills);
  } catch {
    return NextResponse.json({ message: 'Error fetching skills' }, { status: 500 });
  }
}
