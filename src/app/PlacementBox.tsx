'use client';

import Link from 'next/link';

import { pickPlacement, type Placement } from '@/lib/placement-pick';
export type { Placement };

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


export default function PlacementBox({ placements }: { placements: Placement[] }) {
  const pick = pickPlacement(placements, new Date());
  if (!pick) return null;

  const title =
    pick.kind === 'current' ? '이번 주 실습' : pick.kind === 'upcoming' ? '다음 실습' : '이번 주는 자율실습';

  return (
    <div style={{ marginTop: '12px', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '12px 14px', borderRadius: '8px' }}>
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
