'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

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
  date: string;
  timeSlots: {
    time: string;
    applications: Application[];
  }[];
}

export default function ApplicationListClient({ initialApplications }: { initialApplications: Application[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');

  const filtered = initialApplications.filter(app => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return app.status === 'PENDING';
    if (filter === 'APPROVED') return app.status === 'APPROVED';
    return true;
  });

  // Group by Date -> Time
  const grouped = filtered.reduce<GroupedByDate[]>((acc, app) => {
    const dateStr = format(new Date(app.slot.date), 'yyyy-MM-dd (eee)');
    const timeStr = `${app.slot.startTime} ~ ${app.slot.endTime}`;

    let dateGroup = acc.find(d => d.date === dateStr);
    if (!dateGroup) {
      dateGroup = { date: dateStr, timeSlots: [] };
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

  // Sort by date and then time
  grouped.sort((a, b) => b.date.localeCompare(a.date)); // Recent first
  grouped.forEach(g => g.timeSlots.sort((a, b) => a.time.localeCompare(b.time)));

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
      <div className="filter-tabs no-print">
        <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>전체</button>
        <button className={`tab ${filter === 'PENDING' ? 'active' : ''}`} onClick={() => setFilter('PENDING')}>대기 중</button>
        <button className={`tab ${filter === 'APPROVED' ? 'active' : ''}`} onClick={() => setFilter('APPROVED')}>승인됨</button>
      </div>

      <div className="grouped-list">
        {grouped.length === 0 ? (
          <div className="empty-msg">내역이 없습니다.</div>
        ) : (
          grouped.map(dateGroup => (
            <div key={dateGroup.date} className="date-group">
              <h3 className="date-header">{dateGroup.date}</h3>
              <div className="time-slots">
                {dateGroup.timeSlots.map(timeSlot => (
                  <div key={timeSlot.time} className="time-slot-box">
                    <Link 
                      href={`/admin/attendance?date=${new Date(timeSlot.applications[0].slot.date).toISOString().split('T')[0]}&time=${timeSlot.time}`}
                      className="time-header-link"
                    >
                      <h4 className="time-header">{timeSlot.time} <span className="jump-link">명단 보기 ↗</span></h4>
                    </Link>
                    <div className="apps-grid">
                      {timeSlot.applications.map(app => (
                        <div key={app.id} style={{ position: 'relative' }}>
                          <Link href={`/admin/applications/${app.id}`} className="app-item-card">
                            <div className="app-card-header">
                              <span className={`status-dot ${app.status.toLowerCase()}`}></span>
                              <span className="rep-name">{app.representativeUser.name}</span>
                              <span className="student-id">({app.representativeUser.studentId})</span>
                            </div>
                            <div className="app-card-body">
                              <div className="room-info">{app.slot.room}</div>
                              <div className="skill-info">
                                {app.skills.map(s => s.skill.name).join(', ')}
                              </div>
                              <div className="submit-time">
                                신청시각: {format(new Date(app.createdAt), 'MM/dd HH:mm:ss')}
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
        .application-list-container { position: relative; }
        .filter-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
        .tab { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border); background: white; font-size: 0.875rem; cursor: pointer; font-weight: 600; color: var(--sub-text); }
        .tab.active { background: var(--primary); color: white; border-color: var(--primary); }
        
        .date-group { margin-bottom: 40px; }
        .date-header { font-size: 1.125rem; font-weight: 800; color: var(--text); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
        
        .time-slots { display: flex; flex-direction: column; gap: 24px; }
        .time-header-link { text-decoration: none; display: inline-block; margin-bottom: 12px; }
        .time-header { font-size: 0.9375rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px; }
        .time-header-link:hover .time-header { color: var(--accent); }
        .jump-link { font-size: 0.75rem; font-weight: 500; color: var(--sub-text); opacity: 0; transition: opacity 0.2s; }
        .time-header-link:hover .jump-link { opacity: 1; }
        
        .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .app-item-card { display: block; background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s; }
        .app-item-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        
        .app-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.pending { background: #f59e0b; }
        .status-dot.approved { background: #10b981; }
        .status-dot.rejected { background: #ef4444; }
        .status-dot.cancelled { background: #94a3b8; }
        .status-dot.completed { background: #3b82f6; }
        
        .rep-name { font-weight: 700; font-size: 0.9375rem; }
        .student-id { font-size: 0.8125rem; color: var(--sub-text); }
        
        .app-card-body { display: flex; flex-direction: column; gap: 4px; }
        .room-info { font-size: 0.8125rem; color: var(--sub-text); font-weight: 600; }
        .skill-info { font-size: 0.8125rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .submit-time { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }
        
        .quick-delete { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; border: 1px solid #fee2e2; background: #fff5f5; color: #ef4444; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; z-index: 10; }
        .app-item-card:hover + .quick-delete, .quick-delete:hover { opacity: 1; }
        
        .empty-msg { text-align: center; padding: 48px; color: var(--sub-text); background: white; border-radius: 12px; border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
