'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  studentId: string;
  name: string;
  attendanceStatus: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE_30';
  cleanupBad: boolean;
  application: {
    id: string;
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

interface GroupedApplication {
  id: string;
  startTime: string;
  endTime: string;
  room: string;
  skills: string[];
  representative: string;
  additionalRequest: string | null;
  hasUsageLog: boolean;
  participants: Participant[];
}

interface TimeSlotGroup {
  timeLabel: string;
  roomGroups: {
    room: string;
    applications: GroupedApplication[];
  }[];
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
  const [participants, setParticipants] = useState(initialParticipants);
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<string[]>([]);
  const [filterTime, setFilterTime] = useState<string | null>(initialTime || null);

  // Group participants into a structured hierarchy
  let timeSlotGroups = participants.reduce<TimeSlotGroup[]>((acc, p) => {
    // ... same grouping logic ...
    const app = p.application;
    const timeLabel = `${app.slot.startTime} ~ ${app.slot.endTime}`;
    const room = app.slot.room;
    
    // Filter by time if set
    if (filterTime && !timeLabel.includes(filterTime)) return acc;

    let timeGroup = acc.find(g => g.timeLabel === timeLabel);
    if (!timeGroup) {
      timeGroup = { timeLabel, roomGroups: [] };
      acc.push(timeGroup);
    }
    
    let roomGroup = timeGroup.roomGroups.find(rg => rg.room === room);
    if (!roomGroup) {
      roomGroup = { room, applications: [] };
      timeGroup.roomGroups.push(roomGroup);
    }
    
    let groupedApp = roomGroup.applications.find(ga => ga.id === app.id);
    if (!groupedApp) {
      groupedApp = {
        id: app.id,
        startTime: app.slot.startTime,
        endTime: app.slot.endTime,
        room: app.slot.room,
        skills: app.skills.map(s => s.skill.name),
        representative: app.representativeUser?.name || 'Unknown',
        additionalRequest: app.additionalRequest,
        hasUsageLog: app.usageLogs.length > 0,
        participants: []
      };
      roomGroup.applications.push(groupedApp);
    }
    
    groupedApp.participants.push(p);
    return acc;
  }, []);

  // Sort time slots
  timeSlotGroups.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));

  // Expand all by default on first load
  useEffect(() => {
    setExpandedSlots(timeSlotGroups.map(g => g.timeLabel));
  }, [initialParticipants]);

  const toggleSlot = (label: string) => {
    setExpandedSlots(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const updateStatus = async (participantId: string, updates: Partial<Pick<Participant, "attendanceStatus" | "cleanupBad">>) => {
    setLoading(participantId);
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, ...updates })
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, ...updates } : p));
      }
    } finally {
      setLoading(null);
    }
  };

  const updateGroupCleanup = async (applicationId: string, cleanupBad: boolean) => {
    setLoading(`group-${applicationId}`);
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, cleanupAll: cleanupBad })
      });
      if (res.ok) {
        setParticipants(prev => prev.map(p => 
          p.application.id === applicationId ? { ...p, cleanupBad } : p
        ));
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="attendance-container">
      <div className="no-print controls">
        <div className="date-picker-wrapper">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => router.push(`/admin/attendance?date=${e.target.value}`)}
            className="date-input"
          />
          <span className="stats-badge">
            총 {new Set(participants.map(p => p.application.id)).size}팀 ({participants.length}명)
          </span>
          {filterTime && (
            <button className="btn-filter-reset" onClick={() => setFilterTime(null)}>
              ⏰ {filterTime} 필터 해제 (전체 보기)
            </button>
          )}
        </div>
        <button onClick={() => window.print()} className="btn-print">
          🖨️ 명단 인쇄
        </button>
      </div>

      {timeSlotGroups.length === 0 ? (
        <div className="empty-state">
          해당 날짜에 승인된 OPEN LAB 신청이 없습니다.
        </div>
      ) : (
        timeSlotGroups.map((group) => (
          <div key={group.timeLabel} className="time-slot-accordion">
            <button 
              className={`accordion-trigger ${expandedSlots.includes(group.timeLabel) ? 'active' : ''}`}
              onClick={() => toggleSlot(group.timeLabel)}
            >
              <div className="trigger-content">
                <span className="time-text">{group.timeLabel}</span>
                <span className="summary-text">
                  {group.roomGroups.length}개 장소 / {group.roomGroups.reduce((sum, rg) => sum + rg.applications.length, 0)}팀
                </span>
              </div>
              <span className="chevron">{expandedSlots.includes(group.timeLabel) ? '▼' : '▶'}</span>
            </button>
            
            {(expandedSlots.includes(group.timeLabel) || typeof window === 'undefined') && (
              <div className="accordion-content">
                {group.roomGroups.map((roomGroup) => (
                  <div key={roomGroup.room} className="room-section">
                    <div className="room-header">
                      📍 {roomGroup.room}
                    </div>
                    
                    <div className="applications-list">
                      {roomGroup.applications.map((app) => (
                        <div key={app.id} className="app-card">
                          <div className="app-header">
                            <div className="app-info">
                              <span className="rep-name">{app.representative} 팀</span>
                              <span className="skill-tags">{app.skills.join(', ')}</span>
                              {app.hasUsageLog && <span className="log-badge">소감 제출됨</span>}
                            </div>
                            <div className="app-actions no-print">
                               <button 
                                className={`btn-cleanup ${app.participants.every(p => p.cleanupBad) ? 'urgent' : ''}`}
                                onClick={() => updateGroupCleanup(app.id, !app.participants.every(p => p.cleanupBad))}
                                disabled={loading === `group-${app.id}`}
                              >
                                {app.participants.every(p => p.cleanupBad) ? '조 전체 정리불량 해제' : '조 전체 정리불량 처리'}
                              </button>
                            </div>
                          </div>

                          {app.additionalRequest && (
                            <div className="request-box">
                              <strong>요청사항:</strong> {app.additionalRequest}
                            </div>
                          )}

                          <div className="participant-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>학번</th>
                                  <th>이름</th>
                                  <th className="no-print">출석 상태</th>
                                  <th className="no-print">정리 상태</th>
                                  <th className="print-only">서명</th>
                                </tr>
                              </thead>
                              <tbody>
                                {app.participants.map((p) => (
                                  <tr key={p.id}>
                                    <td>{p.studentId}</td>
                                    <td className="font-bold">{p.name}</td>
                                    <td className="no-print">
                                      <select 
                                        value={p.attendanceStatus}
                                        onChange={(e) => updateStatus(p.id, { attendanceStatus: e.target.value as any })}
                                        className={`status-select ${p.attendanceStatus}`}
                                        disabled={loading === p.id}
                                      >
                                        <option value="PENDING">대기</option>
                                        <option value="PRESENT">출석</option>
                                        <option value="ABSENT">불참</option>
                                        <option value="LATE_30">30분↑ 지각</option>
                                      </select>
                                    </td>
                                    <td className="no-print">
                                      <button
                                        className={`cleanup-toggle ${p.cleanupBad ? 'bad' : 'good'}`}
                                        onClick={() => updateStatus(p.id, { cleanupBad: !p.cleanupBad })}
                                        disabled={loading === p.id}
                                      >
                                        {p.cleanupBad ? '❌ 불량' : '✅ 양호'}
                                      </button>
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
          gap: 16px;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .date-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .date-input {
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-weight: 500;
          outline: none;
        }
        .stats-badge {
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--primary);
          background: #e6f0ff;
          padding: 6px 12px;
          border-radius: 20px;
        }
        .btn-filter-reset {
          background: #f1f5f9;
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
        }
        .btn-filter-reset:hover {
          background: #e2e8f0;
        }
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
        
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--sub-text);
        }

        .time-slot-accordion {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .accordion-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: white;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }
        .accordion-trigger:hover {
          background: #f8fafc;
        }
        .accordion-trigger.active {
          border-bottom: 1px solid var(--border);
          background: #f1f5f9;
        }
        .trigger-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .time-text {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--primary);
        }
        .summary-text {
          font-size: 0.875rem;
          color: var(--sub-text);
          font-weight: 500;
        }
        .chevron {
          font-size: 0.75rem;
          color: var(--sub-text);
        }

        .accordion-content {
          padding: 0;
        }
        .room-section {
          padding: 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .room-section:last-child {
          border-bottom: none;
        }
        .room-header {
          padding: 12px 24px;
          background: #f8fafc;
          font-weight: 700;
          font-size: 0.875rem;
          color: #475569;
          border-bottom: 1px solid #f1f5f9;
        }

        .applications-list {
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .app-card {
          border: 1px solid #edf2f7;
          border-radius: 10px;
          padding: 20px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .app-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rep-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }
        .skill-tags {
          font-size: 0.8125rem;
          color: var(--sub-text);
          font-weight: 500;
        }
        .log-badge {
          font-size: 0.6875rem;
          background: #dcfce7;
          color: #166534;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
          font-weight: 700;
        }
        .btn-cleanup {
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: white;
          color: var(--sub-text);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-cleanup:hover {
          background: #f1f5f9;
        }
        .btn-cleanup.urgent {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fecaca;
        }

        .request-box {
          background: #fff9db;
          padding: 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-bottom: 16px;
          border-left: 3px solid #fab005;
        }

        .participant-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .participant-table th {
          text-align: left;
          padding: 8px 12px;
          color: var(--sub-text);
          border-bottom: 2px solid #f1f5f9;
          font-weight: 600;
        }
        .participant-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f8fafc;
        }
        .font-bold { font-weight: 700; }
        
        .status-select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border);
          font-weight: 700;
          font-size: 0.75rem;
          outline: none;
        }
        .status-select.PRESENT { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
        .status-select.ABSENT { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .status-select.LATE_30 { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        
        .cleanup-toggle {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .cleanup-toggle.good { background: #f1f5f9; color: #64748b; }
        .cleanup-toggle.bad { background: #ef4444; color: white; }

        .signature-cell { width: 120px; }
        .print-only { display: none; }

        @media print {
          .no-print { display: none !important; }
          .print-only { display: table-cell !important; }
          .time-slot-accordion { border: none !important; margin: 0; }
          .accordion-trigger { display: none !important; }
          .accordion-content { display: block !important; }
          .app-card { border: 1px solid #000; break-inside: avoid; margin-bottom: 20px; }
          .room-header { border-bottom: 1px solid #000; background: none !important; }
          .participant-table th { border-bottom: 1px solid #000; }
          .participant-table td { border-bottom: 1px solid #000; }
        }
      `}</style>
    </div>
  );
}
