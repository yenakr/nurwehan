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
  };
  skills: Array<{ skill: { name: string } }>;
  createdAt: Date | string;
}

export default function ApplicationListClient({ initialApplications }: { initialApplications: Application[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate week interval based on offset
  const weekInterval = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return { start, end };
  }, [weekOffset]);

  const filteredApplications = useMemo(() => {
    return initialApplications.filter(app => {
      // Status filter
      if (filter !== 'ALL' && app.status !== filter) return false;
      
      // Weekly filter
      const appDate = typeof app.slot.date === 'string' ? parseISO(app.slot.date) : app.slot.date;
      return isWithinInterval(appDate, weekInterval);
    });
  }, [initialApplications, filter, weekInterval]);

  // Grouping: Date -> Time Slot
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

    // Sort dates desc, then times asc
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
      <div className="header-controls">
        <div className="filter-tabs">
          <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>전체</button>
          <button className={`tab ${filter === 'PENDING' ? 'active' : ''}`} onClick={() => setFilter('PENDING')}>대기 중</button>
          <button className={`tab ${filter === 'APPROVED' ? 'active' : ''}`} onClick={() => setFilter('APPROVED')}>승인됨</button>
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
          <div className="empty-msg">선택한 주간에 내역이 없습니다.</div>
        ) : (
          grouped.map(dateGroup => (
            <div key={dateGroup.dateStr} className="date-group-card">
              <div className="date-header-row">
                <h3 className="date-header">{dateGroup.displayDate}</h3>
                <Link 
                  href={`/admin/attendance?date=${dateGroup.dateStr}`}
                  className="jump-link-main"
                >
                  전체 명단 보기 ↗
                </Link>
              </div>
              
              <div className="time-slots">
                {dateGroup.timeSlots.map(timeSlot => (
                  <div key={timeSlot.time} className="time-slot-section">
                    <div className="time-header-row">
                      <h4 className="time-text">{timeSlot.time}</h4>
                    </div>
                    <div className="apps-grid">
                      {timeSlot.applications.map(app => (
                        <div key={app.id} className="app-card-wrapper">
                          <Link href={`/admin/applications/${app.id}`} className="app-item-card">
                            <div className="app-card-header">
                              <span className={`status-dot ${app.status.toLowerCase()}`}></span>
                              <span className="app-time">{formatInTimeZone(new Date(app.createdAt), TIME_ZONE, 'MM/dd HH:mm')}</span>
                            </div>
                            <div className="app-card-body">
                              <div className="applicant-info">
                                <span className="name">{app.representativeUser.name}</span>
                                <span className="student-id">({app.representativeUser.studentId})</span>
                              </div>
                              <div className="room-badge">{app.slot.room}</div>
                              <div className="skill-preview">
                                {app.skills.map(s => s.skill.name).join(', ')}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .admin-applications-view { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        
        .header-controls { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 40px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-tabs { display: flex; gap: 8px; background: white; padding: 6px; border-radius: 12px; border: 1px solid var(--border); }
        .tab { padding: 8px 20px; border: none; background: transparent; border-radius: 8px; font-size: 0.875rem; font-weight: 700; color: var(--sub-text); cursor: pointer; transition: all 0.2s; }
        .tab.active { background: var(--primary); color: white; }

        .week-switcher { display: flex; align-items: center; gap: 16px; background: white; padding: 6px 12px; border-radius: 12px; border: 1px solid var(--border); }
        .week-btn { background: transparent; border: none; font-size: 0.875rem; font-weight: 700; color: var(--sub-text); cursor: pointer; padding: 6px 10px; border-radius: 6px; }
        .week-btn:hover { background: #f1f5f9; color: var(--primary); }
        .current-week-label { font-size: 1rem; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .this-week-badge { background: #e0f2fe; color: #0369a1; font-size: 0.6875rem; padding: 2px 6px; border-radius: 4px; }

        .date-group-card { 
          background: white; 
          border: 1px solid var(--border); 
          border-radius: 20px; 
          padding: 32px; 
          margin-bottom: 32px; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        
        .date-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }
        .date-header { 
          font-size: 1.25rem; 
          font-weight: 900; 
          color: var(--text);
          margin: 0;
        }
        .jump-link-main {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--primary);
          text-decoration: none;
          background: #f0f7ff;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .jump-link-main:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
        }

        .time-slot-section { margin-bottom: 32px; }
        .time-slot-section:last-child { margin-bottom: 0; }
        
        .time-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .time-text { font-size: 1.125rem; font-weight: 900; color: var(--primary); margin: 0; }
        
        .apps-grid { display: flex; flex-wrap: wrap; gap: 16px; }
        .app-card-wrapper { width: calc(50% - 8px); }
        
        .app-item-card { 
          display: block; 
          text-decoration: none; 
          padding: 20px; 
          border: 1px solid #f1f5f9; 
          border-radius: 12px; 
          transition: all 0.2s; 
          background: #fafafa;
        }
        .app-item-card:hover { border-color: var(--primary); background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transform: translateY(-2px); }

        .app-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.pending { background: #eab308; box-shadow: 0 0 8px #fde047; }
        .status-dot.approved { background: #22c55e; box-shadow: 0 0 8px #86efac; }
        .app-time { font-size: 0.75rem; color: var(--sub-text); font-weight: 600; }

        .applicant-info { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
        .applicant-info .name { font-size: 1rem; font-weight: 800; color: var(--text); }
        .applicant-info .student-id { font-size: 0.8125rem; color: var(--sub-text); font-weight: 600; }
        
        .room-badge { font-size: 0.75rem; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: 700; }
        .skill-preview { font-size: 0.8125rem; color: var(--sub-text); line-height: 1.4; font-weight: 500; }

        .empty-msg { text-align: center; padding: 80px; color: var(--sub-text); font-size: 1rem; background: white; border-radius: 20px; border: 1px dashed var(--border); }

        @media (max-width: 768px) {
          .app-card-wrapper { width: 100%; }
        }
      `}</style>
    </div>
  );
}
