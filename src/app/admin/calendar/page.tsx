import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminCalendarClient from './AdminCalendarClient';

export default async function AdminCalendarPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    redirect('/login?redirect=/admin/calendar');
  }

  const events = await prisma.calendarEvent.findMany({
    orderBy: { startDateTime: 'asc' },
  }).catch(() => []);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container">
        <AdminCalendarClient initialEvents={events} />
      </div>
    </main>
  );
}
