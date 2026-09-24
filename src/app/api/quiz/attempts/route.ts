import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Fetch quiz attempts error:', error);
    return NextResponse.json({ error: '퀴즈 풀이 기록 조회 실패' }, { status: 500 });
  }
}
