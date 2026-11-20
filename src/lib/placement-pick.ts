// 서버/클라이언트 공용 (use client 아님)

export interface Placement {
  weekNo: number;
  startDate: string; // YYYY-MM-DD (월)
  endDate: string;   // YYYY-MM-DD (금)
  subject: string;
  hospital: string;
  ward: string;
  shift: string | null;
}

const DAY = 24 * 60 * 60 * 1000;

function parse(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 홈 상단 카드용: 오늘 기준 이번 주(주말이면 다음 주) 실습 정보. 표시할 게 없으면 null. */
export function pickPlacement(placements: Placement[], now: Date) {
  if (!placements.length) return null;
  const sorted = [...placements].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const first = parse(sorted[0].startDate);
  const last = parse(sorted[sorted.length - 1].endDate);

  // 토·일에는 다음 주 월요일 기준으로 본다
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (base.getDay() === 6) base.setDate(base.getDate() + 2);
  if (base.getDay() === 0) base.setDate(base.getDate() + 1);
  const today = ymd(base);

  const current = sorted.filter(p => p.startDate <= today && today <= p.endDate);
  if (current.length) return { kind: 'current' as const, items: current };

  // 실습 기간 안인데 배정이 없는 주 → 자율실습
  if (base >= first && base <= new Date(last.getTime() + 2 * DAY)) {
    const next = sorted.find(p => p.startDate > today);
    return { kind: 'free' as const, items: next ? [next] : [] };
  }
  // 실습 시작 전 2주 이내 → 다음 실습 안내
  if (base < first && first.getTime() - base.getTime() <= 14 * DAY) {
    return { kind: 'upcoming' as const, items: [sorted[0]] };
  }
  return null;
}
