import { getCurrentUser } from '@/lib/auth';
import ClinicalClient from './ClinicalClient';
import type { ScheduleItem } from './MySchedule';
import { getAllProgress } from '@/lib/practicum';
import { aiConfigured } from '@/lib/ai';
import { hasChecklistAccess } from '@/lib/checklist-access';
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

export default async function ClinicalPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await getCurrentUser();
  await purgeExpiredAssignments();
  const schedule = await loadSchedule(user);
  const canCheck = await hasChecklistAccess(user);
  const progress = user && canCheck ? await getAllProgress(user.id) : {};

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '14px 0 32px' }}>
      <div className="container">
        <ClinicalClient schedule={schedule} user={user} progress={progress} aiOn={canCheck && aiConfigured()} canCheck={canCheck} initialTab={tab} />
      </div>
    </main>
  );
}
