import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
  const user = await getCurrentUser();

  const officialEvents = await prisma.calendarEvent.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { startDateTime: 'asc' },
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <CalendarClient initialOfficialEvents={officialEvents} user={user} />
      </div>
    </main>
  );
}
