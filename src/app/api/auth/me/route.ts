import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Always return an object with a "user" key (null if not authenticated)
    return NextResponse.json({ user: user ?? null });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, studentId, grade, phone, email } = body;

    // Fetch current user status
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!currentUser) return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(studentId && { studentId }),
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
