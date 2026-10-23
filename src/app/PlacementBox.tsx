'use client';

import Link from 'next/link';

export interface Placement {
  weekNo: number;
  startDate: string; // YYYY-MM-DD (월)
  endDate: string;   // YYYY-MM-DD (금)
  subject: string;
  hospital: string;
  ward: string;
  shift: string | null;
}

const SHIFT_TIME: Record<string, string> = {
  Day: 'Day 07:30–16:30',
  Eve: 'Evening 12:00–21:00',
};

const DAY = 24 * 60 * 60 * 1000;
const WD = ['일', '월', '화', '수', '목', '금', '토'];

function parse(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmt(s: string) {
  const d = parse(s);
  return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`;
}
function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function subjectLabel(subject: string) {
  return subject.replace('_', ' ');
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

export default function PlacementBox({ placements }: { placements: Placement[] }) {
  const pick = pickPlacement(placements, new Date());
  if (!pick) return null;

  const title =
    pick.kind === 'current' ? '이번 주 실습' : pick.kind === 'upcoming' ? '다음 실습' : '이번 주는 자율실습';

  return (
    <div style={{ marginTop: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '14px 16px', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85, marginBottom: '8px' }}>
        {title}
        {pick.kind !== 'free' && pick.items[0] && (
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>
            {pick.items[0].weekNo}주차 · {fmt(pick.items[0].startDate)} – {fmt(pick.items[0].endDate)}
          </span>
        )}
      </div>

      {pick.kind === 'free' ? (
        <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
          자율실습 주간
          {pick.items[0] && (
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, opacity: 0.9, marginLeft: '8px' }}>
              다음 실습 {fmt(pick.items[0].startDate)}~ · {pick.items[0].hospital} {pick.items[0].ward}
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pick.items.map((p, i) => (
            <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 10px' }}>
              <span style={{ fontSize: '1.0625rem', fontWeight: 800 }}>
                {p.hospital} {p.ward}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#0E4A84', padding: '2px 8px', borderRadius: '999px' }}>
                {subjectLabel(p.subject)}
              </span>
              {p.shift && SHIFT_TIME[p.shift] && (
                <span style={{ fontSize: '0.8125rem', opacity: 0.95 }}>{SHIFT_TIME[p.shift]}</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '8px', textAlign: 'right' }}>
        <Link href="/clinical" style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'underline' }}>
          임상실습 →
        </Link>
      </div>
    </div>
  );
}
