import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function GET() {
  try {
    const events = await prisma.calendarEvent.findMany({
      orderBy: { startDateTime: 'asc' },
    });
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, startDateTime, category, academicYear, applicableGrades, isCommon, status } = body;

    if (!title || !startDateTime || !academicYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        startDateTime: new Date(startDateTime),
        category: category || 'ACADEMIC',
        academicYear: Number(academicYear),
        applicableGrades: applicableGrades || [1, 2, 3, 4],
        isCommon: isCommon ?? false,
        status: status || 'PUBLISHED',
      },
    });

    return NextResponse.json({ event: newEvent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
