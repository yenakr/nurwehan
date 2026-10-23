import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import ClinicalClient from './ClinicalClient';
import type { ScheduleItem } from './MySchedule';

async function loadSchedule(name?: string): Promise<ScheduleItem[]> {
  if (!name) return [];
  try {
    const mine = await prisma.clinicalAssignment.findMany({
      where: { name },
      orderBy: { weekNo: 'asc' },
    });
    if (!mine.length) return [];
    // 같은 주·같은 병동·같은 근무조의 동료
    const others = await prisma.clinicalAssignment.findMany({
      where: {
        term: { in: Array.from(new Set(mine.map(m => m.term))) },
        name: { not: name },
        OR: mine.map(m => ({
          weekNo: m.weekNo,
          subject: m.subject,
          hospital: m.hospital,
          ward: m.ward,
          shift: m.shift,
        })),
      },
      select: { name: true, weekNo: true, subject: true, hospital: true, ward: true, shift: true },
    });
    return mine.map(m => ({
      weekNo: m.weekNo,
      startDate: m.startDate,
      endDate: m.endDate,
      subject: m.subject,
      hospital: m.hospital,
      ward: m.ward,
      shift: m.shift,
      mates: others
        .filter(o => o.weekNo === m.weekNo && o.subject === m.subject && o.hospital === m.hospital && o.ward === m.ward && o.shift === m.shift)
        .map(o => o.name)
        .concat(name)
        .sort((a, b) => a.localeCompare(b, 'ko')),
    }));
  } catch {
    return [];
  }
}

export default async function ClinicalPage() {
  const user = await getCurrentUser();
  const schedule = await loadSchedule(user?.name);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <ClinicalClient schedule={schedule} user={user} />
      </div>
    </main>
  );
}
