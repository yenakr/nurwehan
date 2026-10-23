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
