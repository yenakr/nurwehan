import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      applicationId, 
      practiceContent, 
      difficulty, 
      nextPracticeGoal, 
      actualUsedSupplies, 
      cleanupChecked, 
      wasteChecked 
    } = body;

    if (!applicationId || !practiceContent) {
      return NextResponse.json({ message: '실습 소감을 입력해주세요.' }, { status: 400 });
    }

    // Verify application ownership/participation
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { 
        participants: true,
        usageLogs: {
          where: { submittedBy: user.studentId }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ message: '신청 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAuthorized = application.representativeUserId === user.id || 
                       application.participants.some(p => p.studentId === user.studentId);

    if (!isAuthorized) {
      return NextResponse.json({ message: '작성 권한이 없습니다.' }, { status: 403 });
    }

    if (application.status !== 'APPROVED' && application.status !== 'COMPLETED') {
      return NextResponse.json({ message: '승인된 신청 내역에 대해서만 작성 가능합니다.' }, { status: 403 });
    }

    if (application.usageLogs.length > 0) {
      return NextResponse.json({ message: '이미 실습 소감을 제출했습니다.' }, { status: 409 });
    }

    // Create Usage Log
    const usageLog = await prisma.usageLog.create({
      data: {
        applicationId,
        submittedBy: user.studentId,
        practiceContent,
        difficulty: difficulty || '',
        nextPracticeGoal: nextPracticeGoal || '',
        actualUsedSupplies: actualUsedSupplies || '',
        cleanupChecked: cleanupChecked ?? true,
        wasteChecked: wasteChecked ?? true,
        submittedAt: new Date()
      }
    });

    // Update application status to COMPLETED if it was APPROVED
    if (application.status === 'APPROVED') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'COMPLETED' }
      });
    }

    return NextResponse.json(usageLog);
  } catch (error) {
    console.error('Usage log submission error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (applicationId) {
      const logs = await prisma.usageLog.findMany({
        where: { applicationId },
        orderBy: { submittedAt: 'desc' }
      });
      return NextResponse.json(logs);
    }

    return NextResponse.json({ message: 'applicationId가 필요합니다.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
