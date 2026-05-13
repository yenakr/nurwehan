'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  studentId: string;
  name: string;
  attendanceStatus: 'PENDING' | 'PRESENT' | 'ABSENT';
  cleanupBad: boolean;
  application: {
    id: string;
    submittedAt: Date | string;
    createdAt: Date | string;
    additionalRequest: string | null;
    representativeUser: {
      name: string;
      studentId: string;
    };
    slot: {
      id: string;
      date: Date | string;
      startTime: string;
      endTime: string;
      room: string;
    };
    skills: Array<{ skill: { id: string; name: string } }>;
    usageLogs: { id: string }[];
  };
}

interface RoomGroup {
  room: string;
  participants: Participant[];
}

interface TimeGroup {
  timeLabel: string;
  roomGroups: RoomGroup[];
}

export default function AttendanceClient({ 
  initialParticipants, 
  selectedDate,
  initialTime
}: { 
  initialParticipants: Participant[];
  selectedDate: string;
  initialTime?: string | null;
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [loading, setLoading] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<string[]>([]);
  const [filterTime, setFilterTime] = useState<string | null>(initialTime || null);

  // Fetch data when date changes
  useEffect(() => {
    if (currentDate === selectedDate && participants.length > 0) return;
    
    const fetchData = async () => {
      setParticipants([]); // Clear previous data
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/attendance?date=${currentDate}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setParticipants(data);
          // Sync URL search param
          const url = new URL(window.location.href);
          url.searchParams.set('date', currentDate);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate]);

  // Grouping logic: Time Slot -> Room -> Flat List of Participants
  const processedGroups = participants.reduce<TimeGroup[]>((acc, p) => {
    const app = p.application;
    const timeLabel = `${app.slot.startTime} ~ ${app.slot.endTime}`;
    const room = app.slot.room;

    if (filterTime && !timeLabel.includes(filterTime)) return acc;

    let timeGroup = acc.find(g => g.timeLabel === timeLabel);
    if (!timeGroup) {
      timeGroup = { timeLabel, roomGroups: [] };
      acc.push(timeGroup);
    }

    let roomGroup = timeGroup.roomGroups.find(rg => rg.room === room);
    if (!roomGroup) {
      roomGroup = { room, participants: [] };
      timeGroup.roomGroups.push(roomGroup);
    }

    roomGroup.participants.push(p);
    return acc;
  }, []);

  // Sort time slots
  processedGroups.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  
  // Sort participants within each room by application creation time
  processedGroups.forEach(tg => {
    tg.roomGroups.forEach(rg => {
      rg.participants.sort((a, b) => {
        const dateA = new Date(a.application.submittedAt || a.application.createdAt).getTime();
        const dateB = new Date(b.application.submittedAt || b.application.createdAt).getTime();
        return dateA - dateB;
      });
    });
  });

  // Stats
  const stats = {
    total: participants.length,
    present: participants.filter(p => p.attendanceStatus === 'PRESENT').length,
    absent: participants.filter(p => p.attendanceStatus === 'ABSENT').length,
    pending: participants.filter(p => p.attendanceStatus === 'PENDING').length,
    badCleanup: participants.filter(p => p.cleanupBad).length,
  };

  useEffect(() => {
    setExpandedSlots(processedGroups.map(g => g.timeLabel));
  }, [participants]);

  const toggleSlot = (label: string) => {
    setExpandedSlots(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const updateStatus = async (participantId: string, updates: Partial<Pick<Participant, "attendanceStatus" | "cleanupBad">>) => {
    setUpdateLoading(participantId);
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, ...updates })
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, ...updates } : p));
      } else {
        const error = await res.json();
        alert(error.message || '업데이트에 실패했습니다.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setUpdateLoading(null);
    }
  };

  return (
    <div className="attendance-container">
      <div className="no-print controls">
        <div className="date-picker-wrapper">
          <input 
            type="date" 
            value={currentDate} 
            onChange={(e) => setCurrentDate(e.target.value)}
            className="date-input"
          />
          <div className="stats-group">
            <span className="stats-badge total">총 {stats.total}명</span>
            <span className="stats-badge present">출석 {stats.present}</span>
            <span className="stats-badge absent">불참 {stats.absent}</span>
            <span className="stats-badge pending">대기 {stats.pending}</span>
            <span className="stats-badge cleanup">정리불량 {stats.badCleanup}</span>
          </div>
          {filterTime && (
            <button className="btn-filter-reset" onClick={() => setFilterTime(null)}>
              ⏰ {filterTime} 필터 해제
            </button>
          )}
        </div>
        <button onClick={() => window.print()} className="btn-print">
          🖨️ 명단 인쇄
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>명단을 불러오는 중...</p>
        </div>
      ) : processedGroups.length === 0 ? (
        <div className="empty-state">
          해당 날짜에 승인된 신청 내역이 없습니다.
        </div>
      ) : (
        processedGroups.map((group) => (
          <div key={group.timeLabel} className="time-slot-accordion">
            <button 
              className={`accordion-trigger ${expandedSlots.includes(group.timeLabel) ? 'active' : ''}`}
              onClick={() => toggleSlot(group.timeLabel)}
            >
              <div className="trigger-content">
                <span className="time-text">{group.timeLabel}</span>
                <span className="summary-text">
                  총 {group.roomGroups.reduce((sum, rg) => sum + rg.participants.length, 0)}명
                </span>
              </div>
              <span className="chevron">{expandedSlots.includes(group.timeLabel) ? '▼' : '▶'}</span>
            </button>
            
            {expandedSlots.includes(group.timeLabel) && (
              <div className="accordion-content">
                {group.roomGroups.map((roomGroup) => (
                  <div key={roomGroup.room} className="room-section">
                    <div className="room-header">
                      📍 {roomGroup.room}
                    </div>
                    
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th className="col-idx">순서</th>
                            <th className="no-print col-student">학번/이름</th>
                            <th className="print-only col-student-id">학번</th>
                            <th className="print-only col-name">이름</th>
                            <th className="no-print col-role">구분</th>
                            <th className="col-skill">신청 술기</th>
                            <th className="no-print col-request">요청사항</th>
                            <th className="no-print col-attendance">출석 체크</th>
                            <th className="no-print col-cleanup">정리 상태</th>
                            <th className="print-only signature-cell">서명</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomGroup.participants.map((p, idx) => (
                            <tr key={p.id} className={updateLoading === p.id ? 'row-updating' : ''}>
                              <td className="col-idx">{idx + 1}</td>
                              <td className="no-print col-student">
                                <div className="student-id">{p.studentId}</div>
                                <div className="student-name">{p.name}</div>
                              </td>
                              <td className="print-only col-student-id">{p.studentId}</td>
                              <td className="print-only col-name">{p.name}</td>
                              <td className="no-print col-role">
                                <span className={`role-badge ${p.studentId === p.application.representativeUser.studentId ? 'rep' : 'part'}`}>
                                  {p.studentId === p.application.representativeUser.studentId ? '신청자' : '참여자'}
                                </span>
                              </td>
                              <td className="col-skill">
                                <div className="skill-text">
                                  {p.application.skills.map(s => s.skill.name).join(', ')}
                                </div>
                              </td>
                              <td className="no-print col-request">
                                <div className="request-text">{p.application.additionalRequest || '-'}</div>
                              </td>
                              <td className="no-print col-attendance">
                                <div className="btn-group">
                                  <button 
                                    className={`btn-status present ${p.attendanceStatus === 'PRESENT' ? 'active' : ''}`}
                                    onClick={() => updateStatus(p.id, { attendanceStatus: 'PRESENT' })}
                                    disabled={updateLoading === p.id}
                                  >
                                    출석
                                  </button>
                                  <button 
                                    className={`btn-status absent ${p.attendanceStatus === 'ABSENT' ? 'active' : ''}`}
                                    onClick={() => updateStatus(p.id, { attendanceStatus: 'ABSENT' })}
                                    disabled={updateLoading === p.id}
                                  >
                                    불참
                                  </button>
                                </div>
                              </td>
                              <td className="no-print col-cleanup">
                                <div className="btn-group">
                                  <button 
                                    className={`btn-status good ${!p.cleanupBad ? 'active' : ''}`}
                                    onClick={() => updateStatus(p.id, { cleanupBad: false })}
                                    disabled={updateLoading === p.id}
                                  >
                                    양호
                                  </button>
                                  <button 
                                    className={`btn-status bad ${p.cleanupBad ? 'active' : ''}`}
                                    onClick={() => updateStatus(p.id, { cleanupBad: true })}
                                    disabled={updateLoading === p.id}
                                  >
                                    불량
                                  </button>
                                </div>
                              </td>
                              <td className="print-only signature-cell"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <style jsx global>{`
        .attendance-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 60px;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--muted-background);
          padding: 10px 0;
        }
        .date-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .date-input {
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-weight: 700;
          outline: none;
          color: var(--primary);
        }
        .stats-group {
          display: flex;
          gap: 8px;
        }
        .stats-badge {
          font-weight: 700;
          font-size: 0.8125rem;
          padding: 6px 12px;
          border-radius: 20px;
        }
        .stats-badge.total { background: #f1f5f9; color: #64748b; }
        .stats-badge.present { background: #dcfce7; color: #166534; }
        .stats-badge.absent { background: #fee2e2; color: #991b1b; }
        .stats-badge.pending { background: #fff9db; color: #e67700; }
        .stats-badge.cleanup { background: #fff5f5; color: #c92a2a; }

        .btn-print {
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px;
          gap: 16px;
          color: var(--sub-text);
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f1f5f9;
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .time-slot-accordion {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .accordion-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: white;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .accordion-trigger:hover { background: #f8fafc; }
        .accordion-trigger.active { border-bottom: 1px solid var(--border); background: #f8fafc; }
        .time-text { font-size: 1.25rem; font-weight: 900; color: var(--primary); }
        
        .room-section { margin-bottom: 0; }
        .room-header {
          padding: 12px 24px;
          background: #f1f5f9;
          font-weight: 800;
          font-size: 0.9375rem;
          color: #334155;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 800px; }
        th { 
          background: #fafafa;
          padding: 12px 16px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-align: left;
          text-transform: uppercase;
          border-bottom: 2px solid #f1f5f9;
        }
        td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        
        .col-idx { width: 50px; text-align: center; color: var(--sub-text); font-size: 0.8125rem; }
        .col-student { width: 150px; }
        .student-id { font-size: 0.75rem; color: var(--sub-text); font-family: monospace; }
        .student-name { font-size: 1rem; font-weight: 700; color: var(--text); }
        
        .col-role { width: 80px; }
        .role-badge { 
          font-size: 0.6875rem; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-weight: 800;
        }
        .role-badge.rep { background: #e0f2fe; color: #0369a1; }
        .role-badge.part { background: #f1f5f9; color: #64748b; }

        .col-skill { max-width: 200px; }
        .skill-text { font-size: 0.875rem; color: #475569; line-height: 1.4; }
        
        .col-request { max-width: 200px; }
        .request-text { font-size: 0.8125rem; color: #e67700; background: #fff9db; padding: 4px 8px; border-radius: 4px; display: inline-block; }
        
        .btn-group { display: flex; gap: 4px; }
        .btn-status {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: #94a3b8;
          white-space: nowrap;
        }
        .btn-status:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-status.present.active { background: #22c55e; color: white; border-color: #16a34a; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2); }
        .btn-status.absent.active { background: #ef4444; color: white; border-color: #dc2626; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2); }
        .btn-status.good.active { background: #3b82f6; color: white; border-color: #2563eb; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2); }
        .btn-status.bad.active { background: #f97316; color: white; border-color: #ea580c; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2); }

        .btn-status:hover:not(.active) { background: #f8fafc; color: var(--text); }
        
        .row-updating { opacity: 0.6; pointer-events: none; }
        .signature-cell { width: 100px; border-left: 1px solid #f1f5f9; }
        .print-only { display: none; }

        @media print {
          @page { size: A4; margin: 1cm; }
          .no-print { display: none !important; }
          .print-only { display: table-cell !important; }
          .attendance-container { gap: 0; padding: 0; margin: 0; background: white; }
          .time-slot-accordion { border: none; box-shadow: none; margin-bottom: 30px; border-radius: 0; page-break-inside: avoid; }
          .accordion-trigger { display: block; border-bottom: 2px solid #000; padding: 10px 0; }
          .time-text { color: #000; font-size: 1.5rem; }
          .chevron { display: none; }
          
          .table-wrapper { overflow: visible !important; }
          table { width: 100% !important; table-layout: fixed !important; border: 2px solid #000 !important; }
          th, td { border: 1px solid #000 !important; padding: 12px 8px !important; font-size: 0.875rem !important; color: #000 !important; word-break: break-all; }
          th { background: #eee !important; -webkit-print-color-adjust: exact; }
          
          .col-idx { width: 8% !important; }
          .col-student-id { width: 22% !important; }
          .col-name { width: 18% !important; }
          .col-skill { width: 32% !important; }
          .signature-cell { width: 20% !important; height: 50px; }
          
          .role-badge, .request-text { display: none !important; }
        }
      `}</style>
    </div>
  );
}
