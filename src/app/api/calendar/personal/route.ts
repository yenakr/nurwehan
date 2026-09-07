import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ events: [] });

    const events = await prisma.personalCalendarEvent.findMany({
      where: { userId: user.id },
      orderBy: { startDateTime: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch personal events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, description, startDateTime, endDateTime, category } = body;

    if (!title || !startDateTime) {
      return NextResponse.json({ error: 'Title and Start Date are required' }, { status: 400 });
    }

    const newEvent = await prisma.personalCalendarEvent.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        startDateTime: new Date(startDateTime),
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        category: category || 'PERSONAL',
      },
    });

    return NextResponse.json({ event: newEvent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create personal event' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await prisma.personalCalendarEvent.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete personal event' }, { status: 500 });
  }
}
