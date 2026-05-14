'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Seoul';

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
  selectedDate
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
  const [printingSlot, setPrintingSlot] = useState<string | null>(null);

  // Fetch data when date changes
  useEffect(() => {
    if (currentDate === selectedDate && participants.length > 0) return;
    
    const fetchData = async () => {
      setParticipants([]); 
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/attendance?date=${currentDate}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setParticipants(data);
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

  const processedGroups = participants.reduce<TimeGroup[]>((acc, p) => {
    const app = p.application;
    const timeLabel = `${app.slot.startTime} ~ ${app.slot.endTime}`;
    const room = app.slot.room;

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

  processedGroups.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  
  processedGroups.forEach(tg => {
    tg.roomGroups.forEach(rg => {
      rg.participants.sort((a, b) => {
        const dateA = new Date(a.application.submittedAt || a.application.createdAt).getTime();
        const dateB = new Date(b.application.submittedAt || b.application.createdAt).getTime();
        return dateA - dateB;
      });
    });
  });

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

  const handlePrintSlot = (timeLabel: string) => {
    setPrintingSlot(timeLabel);
    setTimeout(() => {
      window.print();
      setPrintingSlot(null);
    }, 100);
  };

  return (
    <div className={`attendance-container ${printingSlot ? 'printing-mode' : ''}`}>
      <div className="no-print admin-header-nav">
        <div className="title-row">
          <h1>신청자 명단</h1>
          <p>학생들의 출석 상태를 실시간으로 관리하세요.</p>
        </div>
        
        <div className="controls-box">
          <div className="date-selector">
            <label>점검 일자</label>
            <input 
              type="date" 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)}
              className="premium-date-input"
            />
          </div>
          
          <div className="stats-dashboard">
            <div className="stat-card">
              <span className="label">총원</span>
              <span className="value">{stats.total}</span>
            </div>
            <div className="stat-card present">
              <span className="label">출석</span>
              <span className="value">{stats.present}</span>
            </div>
            <div className="stat-card absent">
              <span className="label">불참</span>
              <span className="value">{stats.absent}</span>
            </div>
            <div className="stat-card pending">
              <span className="label">대기</span>
              <span className="value">{stats.pending}</span>
            </div>
            <div className="stat-card cleanup">
              <span className="label">정리불량</span>
              <span className="value">{stats.badCleanup}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="attendance-content">
        {loading ? (
          <div className="premium-loading">
            <div className="loader-ring"></div>
            <p>데이터를 불러오는 중입니다...</p>
          </div>
        ) : processedGroups.length === 0 ? (
          <div className="premium-empty">
             <div className="empty-icon">📅</div>
             <h3>신청 내역이 없습니다.</h3>
             <p>해당 날짜에 승인된 OPEN LAB 신청이 존재하지 않습니다.</p>
          </div>
        ) : (
          processedGroups.map((group) => (
            <div 
              key={group.timeLabel} 
              className={`time-group-wrapper ${printingSlot === group.timeLabel ? 'print-target' : ''}`}
            >
              <div className="group-header no-print">
                <div className="header-left" onClick={() => toggleSlot(group.timeLabel)}>
                  <span className={`chevron ${expandedSlots.includes(group.timeLabel) ? 'down' : ''}`}>▼</span>
                  <h2>{group.timeLabel}</h2>
                  <span className="count-tag">{group.roomGroups.reduce((sum, rg) => sum + rg.participants.length, 0)}명</span>
                </div>
                <div className="header-right">
                  <button className="btn-print-slot" onClick={() => handlePrintSlot(group.timeLabel)}>
                    🖨️ 명단 출력
                  </button>
                </div>
              </div>

              {/* Print Header (Visible only when printing) */}
              <div className="print-header">
                <h1>신청자 명단 ({formatInTimeZone(new Date(currentDate), TIME_ZONE, 'yyyy.MM.dd')})</h1>
                <div className="print-info">
                   <span>시간: {group.timeLabel}</span>
                   <span>인원: {group.roomGroups.reduce((sum, rg) => sum + rg.participants.length, 0)}명</span>
                </div>
              </div>
              
              {(expandedSlots.includes(group.timeLabel) || printingSlot === group.timeLabel) && (
                <div className="group-body">
                  {group.roomGroups.map((roomGroup) => (
                    <div key={roomGroup.room} className="room-container">
                      <div className="room-label">
                        📍 {roomGroup.room}
                      </div>
                      
                      <div className="premium-table-wrapper">
                        <table className="attendance-table">
                          <thead>
                            <tr>
                              <th className="col-idx">순서</th>
                              <th className="col-student-id">학번</th>
                              <th className="col-name">이름</th>
                              <th className="col-skill">신청 술기</th>
                              <th className="no-print col-attendance">출석</th>
                              <th className="no-print col-cleanup">정리</th>
                              <th className="print-only col-signature">서명</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roomGroup.participants.map((p, idx) => (
                              <tr key={p.id} className={updateLoading === p.id ? 'row-busy' : ''}>
                                <td className="col-idx">{idx + 1}</td>
                                <td className="col-student-id">{p.studentId}</td>
                                <td className="col-name">{p.name}</td>
                                <td className="col-skill">
                                  <div className="skill-pill-list">
                                    {p.application.skills.map(s => (
                                      <span key={s.skill.id} className="skill-pill">{s.skill.name}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="no-print col-attendance">
                                  <div className="status-toggle">
                                    <button 
                                      className={`toggle-btn present ${p.attendanceStatus === 'PRESENT' ? 'active' : ''}`}
                                      onClick={() => updateStatus(p.id, { attendanceStatus: 'PRESENT' })}
                                      disabled={updateLoading === p.id}
                                    >출석</button>
                                    <button 
                                      className={`toggle-btn absent ${p.attendanceStatus === 'ABSENT' ? 'active' : ''}`}
                                      onClick={() => updateStatus(p.id, { attendanceStatus: 'ABSENT' })}
                                      disabled={updateLoading === p.id}
                                    >불참</button>
                                  </div>
                                </td>
                                <td className="no-print col-cleanup">
                                  <div className="status-toggle">
                                    <button 
                                      className={`toggle-btn good ${!p.cleanupBad ? 'active' : ''}`}
                                      onClick={() => updateStatus(p.id, { cleanupBad: false })}
                                      disabled={updateLoading === p.id}
                                    >양호</button>
                                    <button 
                                      className={`toggle-btn bad ${p.cleanupBad ? 'active' : ''}`}
                                      onClick={() => updateStatus(p.id, { cleanupBad: true })}
                                      disabled={updateLoading === p.id}
                                    >불량</button>
                                  </div>
                                </td>
                                <td className="print-only col-signature"></td>
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
      </div>

      <style jsx global>{`
        .attendance-container { 
          width: 100%;
          max-width: 1400px;
          margin: 0 auto; 
          padding: 0 20px 40px; 
          font-family: 'Pretendard', sans-serif;
        }

        /* Header UI */
        .admin-header-nav { margin-bottom: 30px; }
        .title-row h1 { font-size: 1.75rem; font-weight: 900; color: var(--text); margin-bottom: 6px; }
        .title-row p { color: var(--sub-text); font-size: 0.9375rem; }

        .controls-box { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          background: white; 
          padding: 20px 24px; 
          border-radius: 16px; 
          border: 1px solid var(--border); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          margin-top: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .date-selector { display: flex; align-items: center; gap: 12px; }
        .date-selector label { font-size: 0.875rem; font-weight: 800; color: var(--sub-text); white-space: nowrap; }
        .premium-date-input { 
          padding: 10px 14px; 
          border: 2px solid #f1f5f9; 
          border-radius: 10px; 
          font-size: 0.9375rem; 
          font-weight: 800; 
          color: var(--primary);
          outline: none;
          transition: border-color 0.2s;
        }
        .premium-date-input:focus { border-color: var(--primary); }

        .stats-dashboard { display: flex; gap: 8px; flex-wrap: wrap; }
        .stat-card { 
          background: #f8fafc; 
          padding: 10px 16px; 
          border-radius: 10px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          min-width: 70px;
        }
        .stat-card .label { font-size: 0.625rem; font-weight: 700; color: #64748b; margin-bottom: 2px; }
        .stat-card .value { font-size: 1.125rem; font-weight: 900; color: #1e293b; }

        .stat-card.present { background: #f0fdf4; }
        .stat-card.present .value { color: #15803d; }
        .stat-card.absent { background: #fef2f2; }
        .stat-card.absent .value { color: #b91c1c; }
        .stat-card.pending { background: #fffbeb; }
        .stat-card.pending .value { color: #b45309; }
        .stat-card.cleanup { background: #fff1f2; }
        .stat-card.cleanup .value { color: #e11d48; }

        /* Content UI */
        .time-group-wrapper { 
          background: white; 
          border: 1px solid var(--border); 
          border-radius: 16px; 
          margin-bottom: 24px; 
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .group-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 16px 24px; 
          background: white;
          border-bottom: 1px solid #f1f5f9;
        }
        .header-left { display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; }
        .chevron { color: #cbd5e1; font-size: 0.75rem; transition: transform 0.2s; }
        .chevron.down { transform: rotate(180deg); }
        .header-left h2 { font-size: 1.25rem; font-weight: 900; color: var(--primary); }
        .count-tag { background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }

        .btn-print-slot { 
          background: white; 
          border: 1px solid #e2e8f0; 
          padding: 8px 14px; 
          border-radius: 8px; 
          font-size: 0.8125rem; 
          font-weight: 800; 
          color: #475569; 
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-print-slot:hover { background: #f8fafc; color: var(--primary); border-color: var(--primary); }

        .group-body { padding: 24px; display: flex; flex-direction: column; gap: 32px; }
        .room-label { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; padding-left: 10px; border-left: 4px solid var(--primary); }

        /* Table Styling */
        .premium-table-wrapper { width: 100%; overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
        .attendance-table { width: 100%; border-collapse: collapse; background: white; }
        .attendance-table th { background: #f8fafc; padding: 12px 14px; font-size: 0.75rem; font-weight: 800; color: #64748b; text-align: left; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
        .attendance-table td { padding: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        
        .col-idx { width: 50px; text-align: center; color: #94a3b8; font-weight: 700; }
        .col-student-id { width: 110px; font-family: monospace; font-weight: 600; color: #475569; font-size: 0.875rem; }
        .col-name { width: 100px; font-weight: 800; color: var(--text); font-size: 0.9375rem; }
        .col-skill { min-width: 200px; }
        .skill-pill-list { display: flex; flex-wrap: wrap; gap: 4px; }
        .skill-pill { background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; }

        .col-attendance, .col-cleanup { width: 140px; }
        .status-toggle { display: flex; background: #f1f5f9; padding: 2px; border-radius: 8px; }
        .toggle-btn { 
          flex: 1; 
          border: none; 
          background: transparent; 
          padding: 6px; 
          font-size: 0.75rem; 
          font-weight: 800; 
          color: #94a3b8; 
          cursor: pointer; 
          border-radius: 6px; 
          transition: all 0.2s;
        }
        .toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .toggle-btn.present.active { background: #22c55e; color: white; box-shadow: 0 2px 4px rgba(34,197,94,0.1); }
        .toggle-btn.absent.active { background: #ef4444; color: white; box-shadow: 0 2px 4px rgba(239,68,68,0.1); }
        .toggle-btn.good.active { background: var(--primary); color: white; }
        .toggle-btn.bad.active { background: #f97316; color: white; }

        .row-busy { opacity: 0.5; pointer-events: none; }

        /* Print Logic */
        .print-header { display: none; }
        .print-only { display: none; }
        
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: table-cell !important; }
          
          .attendance-container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .printing-mode .time-group-wrapper:not(.print-target) { display: none !important; }
          
          .time-group-wrapper { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
          .group-body { padding: 0 !important; width: 100% !important; }
          .room-container { page-break-inside: avoid; margin-bottom: 20px; width: 100% !important; }
          
          .print-header { 
            display: block !important; 
            text-align: center; 
            padding: 40px 20px 20px;
            border-bottom: 2px solid #000;
            margin-bottom: 30px;
          }
          .print-header h1 { font-size: 1.75rem; font-weight: 900; margin-bottom: 10px; }
          .print-info { display: flex; justify-content: center; gap: 40px; font-weight: 700; font-size: 1.125rem; }

          .room-label { border-left: 8px solid #000; padding-left: 15px; font-size: 1.25rem; margin: 20px 0; }
          
          .premium-table-wrapper { overflow: visible !important; width: 100% !important; border: none !important; }
          .attendance-table { width: 100% !important; table-layout: fixed !important; border: 2.5px solid #000 !important; min-width: 0 !important; }
          .attendance-table th, .attendance-table td { border: 1px solid #000 !important; padding: 10px 8px !important; font-size: 0.9rem !important; color: #000 !important; word-break: break-all; }
          .attendance-table th { background: #f0f0f0 !important; font-weight: 900 !important; }
          
          .col-idx { width: 7% !important; }
          .col-student-id { width: 22% !important; }
          .col-name { width: 18% !important; }
          .col-skill { width: 35% !important; }
          .col-signature { width: 18% !important; height: 50px !important; }

          .skill-pill { background: transparent !important; border: 1px solid #ddd !important; display: inline-block; margin: 1px; }
        }
      `}</style>
    </div>
  );
}
