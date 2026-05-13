import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, password } = body;

    if (!studentId || !password) {
      return NextResponse.json({ message: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      return NextResponse.json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // Login successful
    await login({
      id: user.id,
      studentId: user.studentId,
      role: user.role,
      name: user.name,
      grade: user.grade ?? undefined,
    });

    return NextResponse.json({ 
      message: '로그인 성공',
      user: {
        name: user.name,
        role: user.role,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
