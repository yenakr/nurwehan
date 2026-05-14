'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks, 
  isWithinInterval,
  parseISO
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Seoul';

interface Application {
  id: string;
  createdAt: string | Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  selectedGrade: number;
  representativeUser: {
    name: string;
    studentId: string;
  };
  slot: {
    date: string | Date;
    startTime: string;
    endTime: string;
    room: string;
  };
  skills: Array<{ skill: { name: string } }>;
}

interface GroupedByDate {
  dateStr: string;
  displayDate: string;
  timeSlots: {
    time: string;
    applications: Application[];
  }[];
}

export default function ApplicationListClient({ initialApplications }: { initialApplications: Application[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekInterval = useMemo(() => ({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  }), [currentWeekStart]);

  const filtered = useMemo(() => {
    return initialApplications.filter(app => {
      // 1. Status Filter
      if (filter === 'PENDING' && app.status !== 'PENDING') return false;
      if (filter === 'APPROVED' && app.status !== 'APPROVED') return false;

      // 2. Weekly Filter
      const appDate = typeof app.slot.date === 'string' ? parseISO(app.slot.date) : app.slot.date;
      return isWithinInterval(appDate, weekInterval);
    });
  }, [initialApplications, filter, weekInterval]);

  // Group by Date -> Time
  const grouped = useMemo(() => {
    const res = filtered.reduce<GroupedByDate[]>((acc, app) => {
      const appDate = typeof app.slot.date === 'string' ? parseISO(app.slot.date) : app.slot.date;
      const dateKey = format(appDate, 'yyyy-MM-dd');
      const displayDate = formatInTimeZone(appDate, TIME_ZONE, 'yyyy-MM-dd (eee)');
      const timeStr = `${app.slot.startTime} ~ ${app.slot.endTime}`;

      let dateGroup = acc.find(d => d.dateStr === dateKey);
      if (!dateGroup) {
        dateGroup = { dateStr: dateKey, displayDate, timeSlots: [] };
        acc.push(dateGroup);
      }

      let timeSlot = dateGroup.timeSlots.find(t => t.time === timeStr);
      if (!timeSlot) {
        timeSlot = { time: timeStr, applications: [] };
        dateGroup.timeSlots.push(timeSlot);
      }

      timeSlot.applications.push(app);
      return acc;
    }, []);

    // Sort: Recent dates first for the current week, times chronological
    res.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
    res.forEach(g => g.timeSlots.sort((a, b) => a.time.localeCompare(b.time)));
    return res;
  }, [filtered]);

  const changeWeek = (amount: number) => {
    setCurrentWeekStart(prev => amount === 0 ? startOfWeek(new Date(), { weekStartsOn: 1 }) : addWeeks(prev, amount));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/applications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('삭제되었습니다.');
        window.location.reload();
      }
    } catch {
      alert('오류 발생');
    }
  };

  return (
    <div className="application-list-container">
      <div className="header-controls no-print">
        <div className="filter-tabs">
          <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>전체</button>
          <button className={`tab ${filter === 'PENDING' ? 'active' : ''}`} onClick={() => setFilter('PENDING')}>대기 중</button>
          <button className={`tab ${filter === 'APPROVED' ? 'active' : ''}`} onClick={() => setFilter('APPROVED')}>승인됨</button>
        </div>

        <div className="week-switcher">
          <button className="week-btn" onClick={() => changeWeek(-1)}>← 저번 주</button>
          <div className="current-week-label" onClick={() => changeWeek(0)}>
            {format(weekInterval.start, 'MM/dd')} ~ {format(weekInterval.end, 'MM/dd')}
            <span className="this-week-badge">이번 주</span>
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
              <h3 className="date-header">{dateGroup.displayDate}</h3>
              <div className="time-slots">
                {dateGroup.timeSlots.map(timeSlot => (
                  <div key={timeSlot.time} className="time-slot-section">
                    <div className="time-header-row">
                      <h4 className="time-text">{timeSlot.time}</h4>
                      <Link 
                        href={`/admin/attendance?date=${dateGroup.dateStr}&time=${timeSlot.time}`}
                        className="jump-link"
                      >
                        명단 보기 ↗
                      </Link>
                    </div>
                    <div className="apps-grid">
                      {timeSlot.applications.map(app => (
                        <div key={app.id} className="app-card-wrapper">
                          <Link href={`/admin/applications/${app.id}`} className="app-item-card">
                            <div className="app-card-header">
                              <span className={`status-dot ${app.status.toLowerCase()}`}></span>
                              <span className="rep-name">{app.representativeUser.name}</span>
                              <span className="student-id">({app.representativeUser.studentId})</span>
                            </div>
                            <div className="app-card-body">
                              <div className="room-tag">{app.slot.room}</div>
                              <div className="skill-info">
                                {app.skills.map(s => s.skill.name).join(', ')}
                              </div>
                              <div className="submit-time">
                                신청: {formatInTimeZone(new Date(app.createdAt), TIME_ZONE, 'MM/dd HH:mm:ss')}
                              </div>
                            </div>
                          </Link>
                          <button 
                            className="quick-delete no-print"
                            onClick={(e) => handleDelete(e, app.id)}
                            title="삭제"
                          >
                            ×
                          </button>
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
        .application-list-container { max-width: 1200px; margin: 0 auto; }
        
        .header-controls { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .filter-tabs { display: flex; gap: 8px; }
        .tab { 
          padding: 8px 18px; 
          border-radius: 20px; 
          border: 1px solid var(--border); 
          background: white; 
          font-size: 0.8125rem; 
          cursor: pointer; 
          font-weight: 700; 
          color: var(--sub-text);
          transition: all 0.2s;
        }
        .tab.active { background: var(--primary); color: white; border-color: var(--primary); }
        .tab:hover:not(.active) { background: #f8fafc; }

        .week-switcher { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          background: white; 
          padding: 6px; 
          border-radius: 30px; 
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }
        .week-btn { 
          padding: 6px 14px; 
          border: none; 
          background: transparent; 
          font-size: 0.8125rem; 
          font-weight: 600; 
          color: var(--primary); 
          cursor: pointer;
          border-radius: 20px;
        }
        .week-btn:hover { background: #f1f5f9; }
        .current-week-label { 
          font-size: 0.9375rem; 
          font-weight: 800; 
          color: var(--text); 
          display: flex; 
          align-items: center; 
          gap: 8px;
          padding: 0 10px;
          cursor: pointer;
        }
        .this-week-badge {
          font-size: 0.6875rem;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .date-group-card { 
          background: white; 
          border: 1px solid var(--border); 
          border-radius: 16px; 
          padding: 24px; 
          margin-bottom: 32px; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .date-header { 
          font-size: 1.25rem; 
          font-weight: 900; 
          color: var(--text); 
          margin-bottom: 24px; 
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .date-header::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }
        
        .time-slots { display: flex; flex-direction: column; gap: 32px; }
        .time-header-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 16px;
        }
        .time-text { font-size: 1rem; font-weight: 800; color: var(--primary); }
        .jump-link { 
          font-size: 0.75rem; 
          font-weight: 600; 
          color: var(--sub-text); 
          text-decoration: none;
          padding: 4px 10px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .jump-link:hover { background: #f1f5f9; color: var(--primary); }
        
        .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .app-card-wrapper { position: relative; }
        .app-item-card { 
          display: block; 
          background: white; 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          padding: 18px; 
          text-decoration: none; 
          color: inherit; 
          transition: all 0.2s; 
        }
        .app-item-card:hover { 
          border-color: var(--primary);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .app-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.pending { background: #f59e0b; }
        .status-dot.approved { background: #10b981; }
        .status-dot.rejected { background: #ef4444; }
        .status-dot.cancelled { background: #94a3b8; }
        .status-dot.completed { background: #3b82f6; }
        
        .rep-name { font-weight: 800; font-size: 1rem; color: var(--text); }
        .student-id { font-size: 0.8125rem; color: var(--sub-text); font-family: monospace; }
        
        .app-card-body { display: flex; flex-direction: column; gap: 8px; }
        .room-tag { 
          font-size: 0.75rem; 
          color: #475569; 
          font-weight: 700; 
          background: #f1f5f9; 
          padding: 2px 8px; 
          border-radius: 4px;
          width: fit-content;
        }
        .skill-info { font-size: 0.8125rem; color: #475569; line-height: 1.4; height: 2.8em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .submit-time { font-size: 0.6875rem; color: #94a3b8; border-top: 1px dashed #f1f5f9; pt: 8px; margin-top: 4px; }
        
        .quick-delete { 
          position: absolute; 
          top: -8px; 
          right: -8px; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 1px solid #fee2e2; 
          background: #ef4444; 
          color: white; 
          font-size: 14px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          opacity: 0; 
          transition: opacity 0.2s; 
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .app-card-wrapper:hover .quick-delete { opacity: 1; }
        
        .empty-msg { text-align: center; padding: 100px 20px; color: var(--sub-text); background: white; border-radius: 16px; border: 1px dashed var(--border); font-weight: 500; }
      `}</style>
    </div>
  );
}
