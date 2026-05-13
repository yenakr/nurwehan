import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { grade, phone, email } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        grade,
        phone,
        email
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
