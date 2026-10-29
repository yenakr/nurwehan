'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Seoul';

interface Application {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  slot: {
    date: Date | string;
    startTime: string;
    endTime: string;
    room: string;
  };
  representativeUser: {
    name: string;
    studentId: string;
  } | null;
  guestName?: string | null;
  guestStudentId?: string | null;
  skills: Array<{ skill: { name: string } }>;
  createdAt: Date | string;
}

export default function ApplicationListClient({ initialApplications }: { initialApplications: Application[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [weekOffset, setWeekOffset] = useState(0);

  const weekInterval = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return { start, end };
  }, [weekOffset]);

  const filteredApplications = useMemo(() => {
    return initialApplications.filter(app => {
      if (filter === 'PENDING' && app.status !== 'PENDING') return false;
      if (filter === 'APPROVED' && app.status !== 'APPROVED' && app.status !== 'COMPLETED') return false;
      if (filter === 'REJECTED' && app.status !== 'REJECTED') return false;
      
      const appDate = typeof app.slot.date === 'string' ? parseISO(app.slot.date) : app.slot.date;
      return isWithinInterval(appDate, weekInterval);
    });
  }, [initialApplications, filter, weekInterval]);

  const grouped = useMemo(() => {
    const groups: { [key: string]: { dateStr: string; displayDate: string; timeSlots: { time: string; applications: Application[] }[] } } = {};

    filteredApplications.forEach(app => {
      const dateStr = formatInTimeZone(new Date(app.slot.date), TIME_ZONE, 'yyyy-MM-dd');
      const displayDate = formatInTimeZone(new Date(app.slot.date), TIME_ZONE, 'yyyy-MM-dd (EEE)');
      const timeStr = `${app.slot.startTime} ~ ${app.slot.endTime}`;

      if (!groups[dateStr]) {
        groups[dateStr] = { dateStr, displayDate, timeSlots: [] };
      }

      let timeSlot = groups[dateStr].timeSlots.find(ts => ts.time === timeStr);
      if (!timeSlot) {
        timeSlot = { time: timeStr, applications: [] };
        groups[dateStr].timeSlots.push(timeSlot);
      }

      timeSlot.applications.push(app);
    });

    return Object.values(groups)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
      .map(group => ({
        ...group,
        timeSlots: group.timeSlots.sort((a, b) => a.time.localeCompare(b.time))
      }));
  }, [filteredApplications]);

  const changeWeek = (offset: number) => {
    if (offset === 0) setWeekOffset(0);
    else setWeekOffset(prev => prev + offset);
  };

  return (
    <div className="admin-applications-view">
      <div className="header-controls no-print">
        <div className="filter-tabs">
          <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>전체</button>
          <button className={`tab ${filter === 'PENDING' ? 'active' : ''}`} onClick={() => setFilter('PENDING')}>대기 중</button>
          <button className={`tab ${filter === 'APPROVED' ? 'active' : ''}`} onClick={() => setFilter('APPROVED')}>승인됨</button>
          <button className={`tab ${filter === 'REJECTED' ? 'active' : ''}`} onClick={() => setFilter('REJECTED')}>거절됨</button>
        </div>

        <div className="week-switcher">
          <button className="week-btn" onClick={() => changeWeek(-1)}>← 저번 주</button>
          <div className="current-week-label" onClick={() => changeWeek(0)}>
            {format(weekInterval.start, 'MM/dd')} ~ {format(weekInterval.end, 'MM/dd')}
            {weekOffset === 0 && <span className="this-week-badge">이번 주</span>}
          </div>
          <button className="week-btn" onClick={() => changeWeek(1)}>다음 주 →</button>
        </div>
      </div>

      <div className="grouped-list">
        {grouped.length === 0 ? (
          <div className="empty-msg">신청서가 없어요</div>
        ) : (
          grouped.map(dateGroup => (
            <section key={dateGroup.dateStr} className="dg">
              <div className="dg-head">
                <h3>{dateGroup.displayDate}</h3>
                <Link href={`/admin/attendance?date=${dateGroup.dateStr}`} className="jump no-print">승인 명단 ↗</Link>
              </div>
              {dateGroup.timeSlots.map(timeSlot => (
                <div key={timeSlot.time} className="ts">
                  <div className="ts-head">
                    <b>{timeSlot.time}</b>
                    <span>{timeSlot.applications.length}건</span>
                  </div>
                  <div className="rows">
                    {timeSlot.applications.map(app => (
                      <Link key={app.id} href={`/admin/applications/${app.id}`} className="arow">
                        <span className="who">
                          <b>{app.representativeUser?.name ?? app.guestName}</b>
                          <i>{app.representativeUser?.studentId ?? app.guestStudentId}</i>
                          {!app.representativeUser && <em className="guest">비회원</em>}
                        </span>
                        <span className="sk">{app.skills.map(sk => sk.skill.name).join(', ')}</span>
                        <span className="meta">
                          <span className={`st ${app.status.toLowerCase()}`}>
                            {app.status === 'PENDING' ? '대기' : app.status === 'APPROVED' ? '승인' : app.status === 'COMPLETED' ? '완료' : app.status === 'REJECTED' ? '거절' : app.status}
                          </span>
                          <span className="ct">생성 {formatInTimeZone(new Date(app.createdAt), TIME_ZONE, 'MM/dd HH:mm')}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </div>

      <style jsx>{`
        .header-controls { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .filter-tabs { display: inline-flex; background: #f1f5f9; padding: 3px; border-radius: 10px; }
        .tab { padding: 6px 12px; border: none; background: transparent; border-radius: 8px; font-size: 0.8125rem; font-weight: 700; color: #64748b; cursor: pointer; }
        .tab.active { background: #fff; color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .week-switcher { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; }
        .week-btn { border: none; background: transparent; color: var(--sub-text); cursor: pointer; font-size: 0.8125rem; padding: 4px 6px; }
        .current-week-label { font-weight: 800; color: #1e293b; cursor: pointer; display: flex; gap: 6px; align-items: center; }
        .this-week-badge { background: #e8ecf7; color: var(--primary); font-size: 0.6875rem; padding: 1px 6px; border-radius: 999px; }
        .dg { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
        .dg-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .dg-head h3 { margin: 0; font-size: 0.9375rem; font-weight: 800; }
        .jump { font-size: 0.75rem; color: var(--primary); font-weight: 700; text-decoration: none; }
        .ts { margin-top: 8px; }
        .ts-head { display: flex; gap: 8px; align-items: baseline; font-size: 0.8125rem; color: var(--sub-text); padding-bottom: 2px; }
        .ts-head b { color: var(--primary); font-variant-numeric: tabular-nums; }
        .rows { display: flex; flex-direction: column; }
        .arow { display: grid; grid-template-columns: minmax(120px, 170px) 1fr auto; gap: 4px 12px; align-items: center; padding: 8px 0; border-top: 1px solid #f1f5f9; text-decoration: none; color: inherit; }
        .arow:first-child { border-top: none; }
        .who { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
        .who b { font-size: 0.9375rem; font-weight: 800; white-space: nowrap; }
        .who i { font-style: normal; font-size: 0.75rem; color: #94a3b8; }
        .guest { font-style: normal; font-size: 0.625rem; background: #eef2f7; color: #475569; padding: 1px 6px; border-radius: 999px; }
        .sk { font-size: 0.8125rem; color: #475569; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .meta { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
        .st { font-size: 0.6875rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; }
        .st.approved { background: #e8ecf7; color: var(--primary); }
        .st.pending { background: #fff4e0; color: #b9770e; }
        .st.rejected { background: #fdecec; color: #c0392b; }
        .ct { font-size: 0.6875rem; color: #94a3b8; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .empty-msg { text-align: center; padding: 40px 12px; color: #94a3b8; }
        @media (max-width: 560px) {
          .arow { grid-template-columns: 1fr auto; }
          .sk { grid-column: 1 / -1; order: 3; white-space: normal; }
        }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
}
