import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function GET() {
  try {
    const requirements = await prisma.healthRequirement.findMany({
      include: { rules: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ requirements });
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
    const { name, category, description, studentDisplayText, status } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newReq = await prisma.healthRequirement.create({
      data: {
        name,
        category,
        applicableGrades: [3, 4],
        description: description || null,
        studentDisplayText: studentDisplayText || null,
        status: status || 'PUBLISHED',
      },
    });

    return NextResponse.json({ requirement: newReq });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 });
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

    await prisma.healthRequirement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete requirement' }, { status: 500 });
  }
}
