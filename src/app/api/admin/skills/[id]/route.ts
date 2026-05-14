import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

// PATCH /api/admin/skills/[id] - Update skill
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const { name, isActive } = await request.json();
    
    const skill = await prisma.skill.update({
      where: { id },
      data: { name, isActive }
    });

    return NextResponse.json(skill);
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

// DELETE /api/admin/skills/[id] - Delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    // Cascade delete supplies first if not set in prisma
    await prisma.skillSupply.deleteMany({
      where: { skillId: id }
    });

    await prisma.skill.delete({
      where: { id }
    });

    return NextResponse.json({ message: '삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
