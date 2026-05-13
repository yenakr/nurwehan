import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AttendanceClient from './AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await getCurrentUser();
  const { date } = await searchParams;

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  // Default to today in KST
  const today = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstToday = new Date(today.getTime() + kstOffset).toISOString().split('T')[0];
  const selectedDate = date || kstToday;

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

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
          participants: true
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
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
          일일 출석 및 정리 관리
        </h1>
        
        <AttendanceClient 
          initialParticipants={participants as any} 
          selectedDate={selectedDate} 
        />
      </div>
    </main>
  );
}
