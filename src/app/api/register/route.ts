import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = String(body.studentId ?? '').trim();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim().slice(0, 20) : null;
    const password = String(body.password ?? '');
    const grade = Number(body.grade);

    if (!studentId || !name || !grade || !email || !password) {
      return NextResponse.json(
        { message: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }
    if (!/^[A-Za-z0-9]{4,20}$/.test(studentId)) {
      return NextResponse.json({ message: '학번 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (name.length > 30) {
      return NextResponse.json({ message: '이름이 너무 깁니다.' }, { status: 400 });
    }
    if (!Number.isInteger(grade) || grade < 1 || grade > 4) {
      return NextResponse.json({ message: '학년이 올바르지 않습니다.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
      return NextResponse.json({ message: '이메일 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 100) {
      return NextResponse.json({ message: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
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

    // Link legacy records based on studentId
    await prisma.applicationParticipant.updateMany({
      where: { studentId },
      data: { userId: user.id },
    });

    await prisma.restriction.updateMany({
      where: { studentId },
      data: { userId: user.id },
    });

    await prisma.cleanupWarning.updateMany({
      where: { studentId },
      data: { userId: user.id },
    });

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', userId: user.id },
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
