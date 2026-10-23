import { getCurrentUser } from '@/lib/auth';
import ClinicalClient from './ClinicalClient';
import type { ScheduleItem } from './MySchedule';
import { purgeExpiredAssignments, findMyAssignments, findMates } from '@/lib/clinical';

async function loadSchedule(user: any): Promise<ScheduleItem[]> {
  const mine = await findMyAssignments(user);
  if (!mine.length) return [];
  const others = await findMates(user, mine);
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
      .concat(user.name)
      .sort((x, y) => x.localeCompare(y, 'ko')),
  }));
}

export default async function ClinicalPage() {
  const user = await getCurrentUser();
  await purgeExpiredAssignments();
  const schedule = await loadSchedule(user);

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container">
        <ClinicalClient schedule={schedule} user={user} />
      </div>
    </main>
  );
}
