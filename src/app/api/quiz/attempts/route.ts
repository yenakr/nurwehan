import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hiddenSubjectsFor } from '@/lib/access';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요한 서비스입니다.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      subject,
      category,
      quizType,
      score,
      totalQuestions,
      correctCount,
      wrongCount,
      details,
    } = body;

    if (!subject || score === undefined || !totalQuestions) {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
    }

    if ((await hiddenSubjectsFor(user)).includes(subject)) {
      return NextResponse.json({ error: '저장할 수 없습니다.' }, { status: 403 });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        subject,
        category: category || 'all',
        quizType: quizType || 'multiple_choice',
        score: Math.round(score),
        totalQuestions: Number(totalQuestions),
        correctCount: Number(correctCount),
        wrongCount: Number(wrongCount),
        details: details || null,
      },
    });

    // 저장 공간 절약: 사용자별로 최근 20개 기록만 남긴다.
    const stale = await prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: 20,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.quizAttempt.deleteMany({ where: { id: { in: stale.map(a => a.id) } } });
    }

    return NextResponse.json({ success: true, attempt });
  } catch (error) {
    console.error('Save quiz attempt error:', error);
    return NextResponse.json({ error: '퀴즈 풀이 기록 저장 실패' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ attempts: [] });
    }

    const hidden = await hiddenSubjectsFor(user);
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: user.id, ...(hidden.length > 0 && { subject: { notIn: hidden } }) },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Fetch quiz attempts error:', error);
    return NextResponse.json({ error: '퀴즈 풀이 기록 조회 실패' }, { status: 500 });
  }
}
