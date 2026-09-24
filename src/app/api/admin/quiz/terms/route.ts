import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subject, category, term, englishTerm, definition, example, itemType, options, answer } = body;

    if (!term || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTerm = await prisma.nursingTerm.create({
      data: {
        subject: subject || '간호관리학',
        category: category || '기타',
        term: term.trim(),
        englishTerm: englishTerm?.trim() || null,
        definition: definition.trim(),
        example: example?.trim() || null,
        itemType: itemType || (options && options.length > 0 ? 'MULTIPLE_CHOICE' : 'TERM'),
        options: Array.isArray(options) ? options.map((o: string) => o.trim()).filter(Boolean) : [],
        answer: answer?.trim() || null,
      },
    });

    return NextResponse.json({ term: newTerm });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create term' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, subject, category, term, englishTerm, definition, example, itemType, options, answer } = body;

    if (!id || !term || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedTerm = await prisma.nursingTerm.update({
      where: { id },
      data: {
        subject: subject || '간호관리학',
        category: category || '기타',
        term: term.trim(),
        englishTerm: englishTerm?.trim() || null,
        definition: definition.trim(),
        example: example?.trim() || null,
        itemType: itemType || (options && options.length > 0 ? 'MULTIPLE_CHOICE' : 'TERM'),
        options: Array.isArray(options) ? options.map((o: string) => o.trim()).filter(Boolean) : [],
        answer: answer?.trim() || null,
      },
    });

    return NextResponse.json({ term: updatedTerm });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update term' }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await prisma.nursingTerm.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete term' }, { status: 500 });
  }
}
