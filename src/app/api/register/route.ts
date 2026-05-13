import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, name, grade, email, phone, password } = body;

    if (!studentId || !name || !grade || !email || !password) {
      return NextResponse.json(
        { message: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId },
          { email }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.studentId === studentId) {
        return NextResponse.json({ message: '이미 가입된 학번입니다.' }, { status: 400 });
      }
      return NextResponse.json({ message: '이미 사용 중인 이메일입니다.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with PENDING status
    const user = await prisma.user.create({
      data: {
        studentId,
        name,
        grade,
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT',
        approvalStatus: 'PENDING',
      },
    });

    return NextResponse.json(
      { message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
