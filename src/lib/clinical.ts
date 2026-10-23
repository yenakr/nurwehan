import { prisma } from '@/lib/prisma';

const DAY = 24 * 60 * 60 * 1000;

function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 마지막 실습 주가 끝난 지 14일이 지난 학기 데이터를 통째로 비운다. 실패해도 화면에는 영향 없음. */
export async function purgeExpiredAssignments() {
  try {
    const cutoff = ymd(new Date(Date.now() - 14 * DAY));
    const terms = await prisma.clinicalAssignment.groupBy({
      by: ['term'],
      _max: { endDate: true },
    });
    const expired = terms.filter(t => t._max.endDate && t._max.endDate < cutoff).map(t => t.term);
    if (expired.length) {
      await prisma.clinicalAssignment.deleteMany({ where: { term: { in: expired } } });
    }
  } catch {
    // 테이블이 없거나 일시 오류 → 무시
  }
}

/** 관리자용: 배정표 갱신이 필요한지. 데이터가 없거나 마지막 주가 지났으면 true */
export async function assignmentNeedsUpdate() {
  try {
    const agg = await prisma.clinicalAssignment.aggregate({ _max: { endDate: true } });
    const last = agg._max.endDate;
    return !last || last < ymd(new Date());
  } catch {
    return false;
  }
}

const BASE_SELECT = {
  id: true, term: true, name: true, groupNo: true, weekNo: true, startDate: true, endDate: true,
  subject: true, hospital: true, ward: true, shift: true,
} as const;

interface Who {
  name: string;
  studentId: string;
  approvalStatus: string;
}

/**
 * 내 배정 조회. 승인된 회원만. 학번이 적힌 배정은 학번으로, 없는 배정은 이름으로 매칭한다.
 * (학번 칸이 아직 DB에 없으면 이름만으로 조회)
 */
export async function findMyAssignments(user: Who | null) {
  if (!user || user.approvalStatus !== 'APPROVED') return [];
  try {
    return await prisma.clinicalAssignment.findMany({
      where: { OR: [{ studentId: user.studentId }, { name: user.name, studentId: null }] },
      orderBy: { weekNo: 'asc' },
      select: BASE_SELECT,
    });
  } catch {
    try {
      return await prisma.clinicalAssignment.findMany({
        where: { name: user.name },
        orderBy: { weekNo: 'asc' },
        select: BASE_SELECT,
      });
    } catch {
      return [];
    }
  }
}

/** 같은 학기·주·병동·근무조의 다른 사람들 (나 제외) */
export async function findMates(
  user: Who,
  mine: { term: string; weekNo: number; subject: string; hospital: string; ward: string; shift: string | null }[]
) {
  if (!mine.length) return [];
  const where = {
    term: { in: Array.from(new Set(mine.map(m => m.term))) },
    OR: mine.map(m => ({ weekNo: m.weekNo, subject: m.subject, hospital: m.hospital, ward: m.ward, shift: m.shift })),
  };
  const select = { name: true, weekNo: true, subject: true, hospital: true, ward: true, shift: true } as const;
  try {
    return await prisma.clinicalAssignment.findMany({
      where: { ...where, NOT: { OR: [{ studentId: user.studentId }, { name: user.name, studentId: null }] } },
      select,
    });
  } catch {
    try {
      return await prisma.clinicalAssignment.findMany({ where: { ...where, name: { not: user.name } }, select });
    } catch {
      return [];
    }
  }
}
