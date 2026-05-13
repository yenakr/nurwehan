import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AttendanceClient from './AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ date?: string; time?: string }> }) {
  const user = await getCurrentUser();
  const { date, time } = await searchParams;

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  // Default to today in KST
  const now = new Date();
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstToday = kstNow.toISOString().split('T')[0];
  const selectedDate = date || kstToday;

  // Create UTC date range that covers the entire KST day
  // selectedDate is 'YYYY-MM-DD'
  const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
  startOfDay.setHours(startOfDay.getHours() - 9); // Shift to UTC
  
  const endOfDay = new Date(`${selectedDate}T23:59:59.999Z`);
  endOfDay.setHours(endOfDay.getHours() - 9); // Shift to UTC

  const participants = await prisma.applicationParticipant.findMany({
    where: {
      application: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        slot: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }
    },
    include: {
      application: {
        include: {
          slot: true,
          skills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          representativeUser: true,
          participants: true,
          usageLogs: true
        }
      }
    },
    orderBy: [
      { application: { slot: { startTime: 'asc' } } },
      { name: 'asc' }
    ]
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '1000px', padding: '40px 20px' }}>
        <div className="flex-between" style={{ marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>일자/시간별 출석부</h1>
            <p style={{ color: 'var(--sub-text)', marginTop: '4px' }}>날짜와 시간대를 선택하여 학생들의 출석 상태를 관리하세요.</p>
          </div>
        </div>
        
        <AttendanceClient 
          initialParticipants={participants as any} 
          selectedDate={selectedDate} 
          initialTime={time || null}
        />
      </div>
    </main>
  );
}
