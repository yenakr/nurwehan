import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            studentId: true,
            grade: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAttempts = attempts.length;
    const overallAvgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
      : 0;

    // Group by student
    const studentMap: Record<string, {
      studentId: string;
      name: string;
      grade: number | null;
      attemptsCount: number;
      totalScore: number;
      lastAttemptAt: Date;
    }> = {};

    // Group by subject
    const subjectMap: Record<string, { subject: string; count: number; totalScore: number }> = {};

    attempts.forEach(a => {
      // Student aggregation
      const uid = a.userId;
      if (!studentMap[uid]) {
        studentMap[uid] = {
          studentId: a.user.studentId,
          name: a.user.name,
          grade: a.user.grade,
          attemptsCount: 0,
          totalScore: 0,
          lastAttemptAt: a.createdAt,
        };
      }
      studentMap[uid].attemptsCount += 1;
      studentMap[uid].totalScore += a.score;
      if (a.createdAt > studentMap[uid].lastAttemptAt) {
        studentMap[uid].lastAttemptAt = a.createdAt;
      }

      // Subject aggregation
      const sub = a.subject;
      if (!subjectMap[sub]) {
        subjectMap[sub] = { subject: sub, count: 0, totalScore: 0 };
      }
      subjectMap[sub].count += 1;
      subjectMap[sub].totalScore += a.score;
    });

    const studentStats = Object.values(studentMap).map(s => ({
      ...s,
      avgScore: Math.round(s.totalScore / s.attemptsCount),
    })).sort((a, b) => b.attemptsCount - a.attemptsCount);

    const subjectStats = Object.values(subjectMap).map(s => ({
      ...s,
      avgScore: Math.round(s.totalScore / s.count),
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalAttempts,
      activeStudentsCount: studentStats.length,
      overallAvgScore,
      studentStats,
      subjectStats,
      recentAttempts: attempts.slice(0, 30),
    });
  } catch (error) {
    console.error('Fetch admin quiz stats error:', error);
    return NextResponse.json({ error: '퀴즈 학습 현황 불러오기 실패' }, { status: 500 });
  }
}
