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
          <div className="empty-msg">선택한 주간에 내역이 없습니다.</div>
        ) : (
          grouped.map(dateGroup => (
            <div key={dateGroup.dateStr} className="date-group-card">
              <div className="date-header-row">
                <h3 className="date-header">{dateGroup.displayDate}</h3>
                <Link 
                  href={`/admin/attendance?date=${dateGroup.dateStr}`}
                  className="jump-link-main no-print"
                >
                  전체 명단 보기 ↗
                </Link>
              </div>
              
              <div className="time-slots">
                {dateGroup.timeSlots.map(timeSlot => (
                  <div key={timeSlot.time} className="time-slot-section">
                    <div className="time-header-row">
                      <h4 className="time-text">{timeSlot.time}</h4>
                      <span className="slot-count">{timeSlot.applications.length}명</span>
                    </div>
                    
                    <div className="apps-grid">
                      {timeSlot.applications.map(app => (
                        <Link key={app.id} href={`/admin/applications/${app.id}`} className="app-item-card">
                          <div className="card-top">
                            <div className="status-indicator">
                              <span className={`status-dot ${app.status.toLowerCase()}`}></span>
                              <span className={`status-text ${app.status === 'REJECTED' ? 'text-rejected' : ''}`}>
                                {app.status === 'PENDING' ? '대기' : 
                                 app.status === 'APPROVED' ? '승인' : 
                                 app.status === 'COMPLETED' ? '참여 완료' : 
                                 app.status === 'REJECTED' ? '거절됨' : app.status}
                              </span>
                            </div>
                            <span className="app-time">{formatInTimeZone(new Date(app.createdAt), TIME_ZONE, 'MM/dd HH:mm')}</span>
                          </div>

                          <div className="card-mid">
                            <div className="applicant-primary">
                              <span className="name">{app.representativeUser.name}</span>
                              <span className="student-id">{app.representativeUser.studentId}</span>
                            </div>
                          </div>

                          <div className="card-bottom">
                            <div className="skills-list">
                              {app.skills.map(s => s.skill.name).join(', ')}
                            </div>
                          </div>
                        </Link>
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
          max-width: 1400px; 
          margin: 0 auto; 
          padding: 0 20px 60px; 
          font-family: 'Pretendard', sans-serif;
        }
        
        .header-controls { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 30px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-tabs { display: flex; gap: 6px; background: #f1f5f9; padding: 4px; border-radius: 12px; }
        .tab { 
          padding: 8px 18px; 
          border: none; 
          background: transparent; 
          border-radius: 8px; 
          font-size: 0.875rem; 
          font-weight: 700; 
          color: #64748b; 
          cursor: pointer; 
          transition: all 0.2s; 
        }
        .tab.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .week-switcher { display: flex; align-items: center; gap: 12px; background: white; padding: 4px 8px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .week-btn { background: transparent; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; padding: 4px 10px; border-radius: 8px; transition: all 0.2s; }
        .week-btn:hover { background: #f8fafc; color: var(--primary); }
        .current-week-label { font-size: 0.9375rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .this-week-badge { background: #e0f2fe; color: #0369a1; font-size: 0.625rem; padding: 2px 6px; border-radius: 4px; }

        .date-group-card { 
          background: white; 
          border: 1px solid #e2e8f0; 
          border-radius: 24px; 
          padding: 32px; 
          margin-bottom: 32px; 
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        
        .date-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }
        .date-header { font-size: 1.5rem; font-weight: 900; color: #1e293b; margin: 0; }
        .jump-link-main {
          font-size: 0.8125rem;
          font-weight: 800;
          color: var(--primary);
          text-decoration: none;
          background: #f0f7ff;
          padding: 10px 18px;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .jump-link-main:hover { background: var(--primary); color: white; transform: translateY(-2px); }

        .time-slot-section { margin-bottom: 48px; }
        .time-slot-section:last-child { margin-bottom: 0; }
        
        .time-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .time-text { font-size: 1.25rem; font-weight: 900; color: var(--primary); margin: 0; }
        .slot-count { font-size: 0.875rem; font-weight: 700; color: #94a3b8; background: #f8fafc; padding: 2px 10px; border-radius: 20px; }
        
        /* Grid Layout */
        .apps-grid { 
          display: grid; 
          grid-template-columns: repeat(1, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .apps-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .apps-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .apps-grid { grid-template-columns: repeat(4, 1fr); } }

        /* Premium Card Design */
        .app-item-card { 
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 150px;
          padding: 16px; 
          background: white;
          border: 1px solid #e2e8f0; 
          border-radius: 16px; 
          text-decoration: none; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .app-item-card:hover { 
          border-color: var(--primary); 
          box-shadow: 0 12px 20px -5px rgba(0,0,0,0.08); 
          transform: translateY(-4px); 
        }

        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .status-indicator { display: flex; align-items: center; gap: 6px; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot.pending { background: #f59e0b; box-shadow: 0 0 8px #fbbf24; }
        .status-dot.approved { background: #10b981; box-shadow: 0 0 8px #34d399; }
        .status-dot.completed { background: #64748b; }
        .status-dot.rejected { background: #ef4444; box-shadow: 0 0 8px #fca5a5; }
        .status-text { font-size: 0.6875rem; font-weight: 800; color: #64748b; }
        .status-text.text-rejected { color: #ef4444; }
        .app-time { font-size: 0.6875rem; color: #94a3b8; font-weight: 600; }

        .card-mid { margin-bottom: 12px; }
        .applicant-primary { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
        .applicant-primary .name { font-size: 1.0625rem; font-weight: 900; color: #1e293b; }
        .applicant-primary .student-id { font-size: 0.8125rem; color: #94a3b8; font-weight: 600; font-family: monospace; }
        

        .card-bottom { 
          padding-top: 12px; 
          border-top: 1px dashed #f1f5f9; 
        }
        .skills-list { 
          font-size: 0.8125rem; 
          color: #64748b; 
          line-height: 1.5; 
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .empty-msg { text-align: center; padding: 100px 40px; color: #94a3b8; font-size: 1rem; font-weight: 600; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; }

        @media print {
          .no-print { display: none !important; }
          .admin-applications-view { padding: 0; max-width: none; }
          .date-group-card { border: none; box-shadow: none; padding: 0; margin-bottom: 50px; page-break-inside: avoid; }
          .apps-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px; }
          .app-item-card { border: 1px solid #000; box-shadow: none !important; transform: none !important; min-height: 120px; }
        }
      `}</style>
    </div>
  );
}
