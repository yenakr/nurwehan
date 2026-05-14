import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

// POST /api/admin/skills/[id]/supplies - Add supply to skill
export async function POST(
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
    
    const supply = await prisma.skillSupply.create({
      data: {
        skillId: id,
        supplyName,
        quantity,
        unit,
        note
      }
    });

    return NextResponse.json(supply);
  } catch (error) {
    return NextResponse.json({ message: '서버 오류' }, { status: 500 });
  }
}
