'use client';

import { useMemo, useState } from 'react';

export interface ScheduleItem {
  weekNo: number;
  startDate: string; // YYYY-MM-DD (월)
  endDate: string;   // YYYY-MM-DD (금)
  subject: string;
  hospital: string;
  ward: string;
  shift: string | null;
  mates: string[];
}

const SHIFT_TIME: Record<string, [string, string]> = { Day: ['07:30', '16:30'], Eve: ['12:00', '21:00'] };
const SHIFT_LABEL: Record<string, string> = { Day: 'Day', Eve: 'Evening' };
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const TOTAL_WEEKS = 8;

const pad = (n: number) => String(n).padStart(2, '0');
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const md = (s: string) => {
  const d = parse(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const place = (i: ScheduleItem) => `${i.hospital} ${i.ward}`;
const subjectLabel = (s: string) => s.replace('_', ' ');
const timeText = (i: ScheduleItem) =>
  i.shift && SHIFT_TIME[i.shift] ? `${SHIFT_LABEL[i.shift]} ${SHIFT_TIME[i.shift].join('–')}` : '';

const COLORS: Record<string, string> = {
  성인1: '#DBEAFE',
  성인2: '#FED7AA',
  간호과정: '#ECFCCB',
  여성_산과: '#FBCFE8',
  여성_부인과: '#FBCFE8',
  여성: '#FBCFE8',
};

function buildIcs(items: ScheduleItem[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NURwehan//clinical//KO', 'CALSCALE:GREGORIAN'];
  items.forEach((it, idx) => {
    const t = it.shift ? SHIFT_TIME[it.shift] : null;
    for (let d = 0; d < 5; d++) {
      const day = addDays(it.startDate, d);
      const base = day.replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:clinical-${it.weekNo}-${idx}-${base}@nurwehan`, `DTSTAMP:${stamp}`);
      if (t) {
        lines.push(`DTSTART:${base}T${t[0].replace(':', '')}00`, `DTEND:${base}T${t[1].replace(':', '')}00`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${base}`, `DTEND;VALUE=DATE:${addDays(day, 1).replace(/-/g, '')}`);
      }
      lines.push(`SUMMARY:실습 ${place(it)} (${subjectLabel(it.subject)})`);
      if (it.mates.length > 1) lines.push(`DESCRIPTION:${it.mates.join(', ')}`);
      lines.push('END:VEVENT');
    }
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default function MySchedule({
  schedule,
  me,
  noteDates,
  onPickDay,
}: {
  schedule: ScheduleItem[];
  me?: string;
  noteDates?: Set<string>;
  onPickDay?: (date: string) => void;
}) {
  const today = ymd(new Date());

  const firstStart = schedule[0]?.startDate;
  const weeks = useMemo(() => {
    if (!firstStart) return [];
    const byWeek = new Map(schedule.map(s => [s.weekNo, s]));
    const list: { weekNo: number; startDate: string; endDate: string; item?: ScheduleItem }[] = [];
    // 모든 조의 주차 날짜는 같다: 1주차 월요일부터 7일 간격
    const week1 = addDays(schedule[0].startDate, -7 * (schedule[0].weekNo - 1));
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const start = addDays(week1, 7 * (w - 1));
      list.push({ weekNo: w, startDate: start, endDate: addDays(start, 4), item: byWeek.get(w) });
    }
    return list;
  }, [schedule, firstStart]);

  const initialMonth = useMemo(() => {
    if (!weeks.length) return new Date();
    const first = parse(weeks[0].startDate);
    const last = parse(weeks[weeks.length - 1].endDate);
    const now = new Date();
    const clamp = now < first ? first : now > last ? last : now;
    return new Date(clamp.getFullYear(), clamp.getMonth(), 1);
  }, [weeks]);
  const [month, setMonth] = useState(initialMonth);

  if (!schedule.length) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)', fontSize: '0.9rem', padding: '32px 16px' }}>
        등록된 정보가 없습니다.
      </div>
    );
  }

  // 달력 셀
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1);
  gridStart.setDate(1 - gridStart.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  const rowsNeeded = cells[35].getMonth() === month.getMonth() ? 6 : 5;
  const itemOnDay = (s: string) => weeks.find(w => w.startDate <= s && s <= w.endDate);

  const firstMonth = parse(weeks[0].startDate);
  const lastMonth = parse(weeks[weeks.length - 1].endDate);
  const canPrev = new Date(month.getFullYear(), month.getMonth() - 1, 1) >= new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(schedule)], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '임상실습_일정.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 주차별 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 800 }}>내 실습 일정</h3>
          <button onClick={downloadIcs} className="btn-outline" style={{ fontSize: '0.8125rem' }}>
            내 캘린더에 추가 (.ics)
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {weeks.map(w => {
            const current = w.startDate <= today && today <= addDays(w.endDate, 2);
            const it = w.item;
            return (
              <div
                key={w.weekNo}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr',
                  gap: '4px 12px',
                  padding: '12px 10px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: current ? '#EFF6FF' : 'transparent',
                  borderLeft: current ? '3px solid var(--primary)' : '3px solid transparent',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{w.weekNo}주차</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>
                    {md(w.startDate)}–{md(w.endDate)}
                  </div>
                </div>
                {it ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                      <span style={{ fontWeight: 700 }}>{place(it)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: COLORS[it.subject] || '#E5E7EB', padding: '1px 8px', borderRadius: '999px' }}>
                        {subjectLabel(it.subject)}
                      </span>
                      {timeText(it) && <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>{timeText(it)}</span>}
                    </div>
                    {it.mates.length > 1 && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', marginTop: '4px' }}>
                        {it.mates.map((n, k) => (
                          <span key={n}>
                            {k > 0 && ', '}
                            {n === me ? <strong style={{ color: 'var(--primary)' }}>{n}</strong> : n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--sub-text)', fontWeight: 600 }}>자율실습</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 월 달력 */}
      <div className="card">
        {onPickDay && <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)', marginBottom: '8px' }}>날짜를 누르면 그날 실습일지를 쓸 수 있어요. ● 표시는 일지가 있는 날이에요.</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button className="btn-outline" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={{ padding: '4px 12px' }}>
            ‹
          </button>
          <strong>{month.getFullYear()}년 {month.getMonth() + 1}월</strong>
          <button className="btn-outline" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={{ padding: '4px 12px' }}>
            ›
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px', fontSize: '0.6875rem' }}>
          {WD.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 700, color: i === 0 ? '#DC2626' : i === 6 ? '#2563EB' : 'var(--sub-text)', padding: '2px 0' }}>
              {d}
            </div>
          ))}
          {cells.slice(0, rowsNeeded * 7).map(d => {
            const s = ymd(d);
            const inMonth = d.getMonth() === month.getMonth();
            const wk = itemOnDay(s);
            const weekday = d.getDay() >= 1 && d.getDay() <= 5;
            const it = wk && weekday ? wk.item : undefined;
            const free = wk && weekday && !wk.item;
            const hasNote = !!noteDates?.has(s);
            return (
              <div
                key={s}
                onClick={it && onPickDay ? () => onPickDay(s) : undefined}
                style={{
                  cursor: it && onPickDay ? 'pointer' : 'default',
                  position: 'relative',
                  minHeight: '54px',
                  padding: '3px',
                  borderRadius: '4px',
                  opacity: inMonth ? 1 : 0.35,
                  backgroundColor: it ? COLORS[it.subject] || '#E5E7EB' : free ? '#F3F4F6' : '#FFFFFF',
                  border: s === today ? '2px solid var(--primary)' : '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontWeight: 700 }}>{d.getDate()}</div>
                {hasNote && <span style={{ position: 'absolute', top: '3px', right: '5px', color: 'var(--primary)', fontSize: '0.75rem', lineHeight: 1 }}>●</span>}
                {it && (
                  <div style={{ fontSize: '0.625rem', lineHeight: 1.25, wordBreak: 'keep-all' }}>
                    {it.ward}
                    {it.shift && <div style={{ fontWeight: 700 }}>{it.shift === 'Eve' ? 'Eve' : 'Day'}</div>}
                  </div>
                )}
                {free && <div style={{ fontSize: '0.625rem', color: 'var(--sub-text)' }}>자율</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
