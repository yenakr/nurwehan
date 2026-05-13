import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');

  if (!grade) {
    return NextResponse.json({ message: 'Grade is required' }, { status: 400 });
  }

  try {
    const slots = await prisma.openLabSlot.findMany({
      where: {
        allowedGrade: parseInt(grade),
        status: 'OPEN',
        date: {
          gte: new Date(), // Only future slots
        }
      },
      include: {
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: ['PENDING', 'APPROVED']
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching slots' }, { status: 500 });
  }
}
