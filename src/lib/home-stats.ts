import { prisma } from './prisma';
import { getFavoriteIds } from './favorites';
import { isAdminRole } from './auth-core';
import { pickPlacement, type Placement } from '@/app/PlacementBox';
import type { HomeTilesData, TileStat } from '@/app/HomeTiles';

type Viewer = { id: string; role: string; approvalStatus?: string | null } | null;

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const DAY = 24 * 60 * 60 * 1000;

function todayStr(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function quizStats(user: Viewer & {}): Promise<TileStat[]> {
  try {
    const [week, recent, favs] = await Promise.all([
      prisma.quizAttempt.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 7 * DAY) } } }),
      prisma.quizAttempt.findMany({ where: { userId: user.id }, select: { score: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      getFavoriteIds(user.id),
    ]);
    const avg = recent.length ? Math.round(recent.reduce((n, a) => n + a.score, 0) / recent.length) : null;
    const out: TileStat[] = [
      { value: `${week}회`, label: '이번 주' },
      { value: avg === null ? '-' : `${avg}%`, label: '평균 정답률' },
    ];
    if (favs.length > 0) out.push({ value: String(favs.length), label: '즐겨찾기' });
    return out;
  } catch {
    return [];
  }
}

async function clinicalStats(user: Viewer & {}, placements: Placement[]): Promise<TileStat[]> {
  if (placements.length === 0) return [];
  try {
    const pick = pickPlacement(placements, new Date());
    const today = todayStr();
    const left = placements.filter(p => p.startDate > today).length;
    const out: TileStat[] = [];
    if (pick?.kind === 'current' && pick.items[0]) out.push({ value: `${pick.items[0].weekNo}주차`, label: '이번 주' });
    else if (pick?.kind === 'free') out.push({ value: '자율', label: '이번 주' });
    else if (pick?.kind === 'upcoming') out.push({ value: '예정', label: '다음 실습' });
    out.push({ value: `${left}주`, label: '남은 실습' });
    const notes = await prisma.clinicalNote.count({ where: { userId: user.id } }).catch(() => 0);
    out.push({ value: String(notes), label: '메모' });
    return out;
  } catch {
    return [];
  }
}

async function labStats(user: Viewer & {}): Promise<TileStat[]> {
  try {
    const apps = await prisma.application.findMany({
      where: { representativeUserId: user.id, status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] } },
      select: { status: true, slot: { select: { date: true } } },
    });
    if (apps.length === 0) return [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const upcoming = apps
      .filter(a => a.status !== 'COMPLETED' && a.slot?.date && new Date(a.slot.date) >= startOfToday)
      .map(a => new Date(a.slot!.date))
      .sort((a, b) => a.getTime() - b.getTime());
    const out: TileStat[] = [];
    if (upcoming[0]) {
      const d = upcoming[0];
      out.push({ value: `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`, label: '다음 사용' });
    }
    out.push({ value: `${upcoming.length}건`, label: '예정' });
    out.push({ value: `${apps.length}건`, label: '전체 신청서' });
    return out;
  } catch {
    return [];
  }
}

export async function getHomeTiles(user: Viewer, placements: Placement[]): Promise<HomeTilesData> {
  const ok = !!user && (user.approvalStatus === 'APPROVED' || isAdminRole(user.role));
  if (!user || !ok) return { quiz: [], clinical: [], lab: [] };
  const [quiz, clinical, lab] = await Promise.all([quizStats(user), clinicalStats(user, placements), labStats(user)]);
  return { quiz, clinical, lab };
}
