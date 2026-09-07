import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function GET() {
  try {
    const items = await prisma.roadmapItem.findMany({
      orderBy: [{ recommendedGrade: 'asc' }, { priority: 'asc' }],
    });
    return NextResponse.json({ items });
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
    const { title, description, category, recommendedGrade, recommendedSemester, isRequired, status } = body;

    if (!title || !category || !recommendedGrade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await prisma.roadmapItem.create({
      data: {
        title,
        description: description || null,
        category,
        recommendedGrade: Number(recommendedGrade),
        recommendedSemester: recommendedSemester ? Number(recommendedSemester) : null,
        isRequired: isRequired ?? true,
        status: status || 'PUBLISHED',
      },
    });

    return NextResponse.json({ item: newItem });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create roadmap item' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, description, category, recommendedGrade, recommendedSemester, isRequired, status } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updatedItem = await prisma.roadmapItem.update({
      where: { id },
      data: {
        title,
        description: description || null,
        category,
        recommendedGrade: Number(recommendedGrade),
        recommendedSemester: recommendedSemester ? Number(recommendedSemester) : null,
        isRequired,
        status,
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update roadmap item' }, { status: 500 });
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

    await prisma.roadmapItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete roadmap item' }, { status: 500 });
  }
}
