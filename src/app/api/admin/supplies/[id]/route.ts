import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

// PATCH /api/admin/supplies/[id] - Update supply
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

    const { supplyName, quantity, unit, note } = await request.json();
    
    const supply = await prisma.skillSupply.update({
      where: { id },
      data: { supplyName, quantity, unit, note }
    });

    return NextResponse.json(supply);
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}

// DELETE /api/admin/supplies/[id] - Delete supply
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

    await prisma.skillSupply.delete({
      where: { id }
    });

    return NextResponse.json({ message: '삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
