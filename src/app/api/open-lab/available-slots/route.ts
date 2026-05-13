import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApplicationWindow } from '@/lib/application-window';
import { addDays, isBefore, isAfter, startOfDay, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    
    // 1. Get all active rules
    const rules = await prisma.openLabGradeRule.findMany({
      where: { isActive: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // 2. Generate slots for the next 14 days
    const slots = [];
    const now = new Date();
    const today = startOfDay(now);

    for (const rule of rules) {
      // Find dates matching rule.dayOfWeek in the next 14 days
      for (let i = 0; i <= 14; i++) {
        const d = addDays(today, i);
        if (d.getDay() === rule.dayOfWeek) {
          // Check application window
          const { start, end } = getApplicationWindow(d);
          
          if (isAfter(now, start) && isBefore(now, end)) {
            slots.push({
              ruleId: rule.id,
              date: format(d, 'yyyy-MM-dd'),
              startTime: rule.startTime,
              endTime: rule.endTime,
              room: rule.room,
              grade: rule.grade,
              maxCapacity: rule.maxCapacity
            });
          }
        }
      }
    }

    // 3. Enrich with remaining capacity
    const enrichedSlots = await Promise.all(slots.map(async (slot) => {
      const startOfSlotDay = new Date(slot.date);
      startOfSlotDay.setHours(0,0,0,0);
      const endOfSlotDay = new Date(slot.date);
      endOfSlotDay.setHours(23,59,59,999);

      const applications = await prisma.application.findMany({
        where: {
          slot: {
            date: { gte: startOfSlotDay, lte: endOfSlotDay },
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room
          },
          status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] }
        },
        include: { participants: true }
      });

      const usedCapacity = applications.reduce((sum, app) => sum + app.participants.length, 0);
      return {
        ...slot,
        remaining: Math.max(0, slot.maxCapacity - usedCapacity)
      };
    }));

    // Sort by date and then time
    enrichedSlots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json(enrichedSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
