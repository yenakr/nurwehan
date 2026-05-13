'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  studentId: string;
  name: string;
  attendanceStatus: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE_30';
  cleanupBad: boolean;
  application: {
    slot: {
      startTime: string;
      endTime: string;
      room: string;
    };
    skills: Array<{ skill: { name: string } }>;
  };
}

export default function AttendanceClient({ 
  initialParticipants, 
  selectedDate 
}: { 
  initialParticipants: Participant[];
  selectedDate: string;
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [loading, setLoading] = useState<string | null>(null);

  // Group participants by application
  const applications = participants.reduce((acc, p) => {
    const appId = p.application.id;
    if (!acc[appId]) {
      acc[appId] = {
        id: appId,
        startTime: p.application.slot.startTime,
        endTime: p.application.slot.endTime,
        room: p.application.slot.room,
        skills: p.application.skills.map(s => s.skill.name),
        representative: (p.application as any).representativeUser?.name || 'Unknown',
        participants: []
      };
    }
    acc[appId].participants.push(p);
    return acc;
  }, {} as Record<string, any>);

  const updateStatus = async (participantId: string, updates: any) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => router.push(`/admin/attendance?date=${e.target.value}`)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '0.9375rem', fontWeight: '600' }}>
            총 {Object.keys(applications).length}팀 ({participants.length}명)
          </span>
        </div>
        <button onClick={() => window.print()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🖨️</span> 명단 인쇄
        </button>
      </div>

      {Object.values(applications).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--sub-text)' }}>
          해당 날짜에 승인된 신청 내역이 없습니다.
        </div>
      ) : (
        Object.values(applications).map((app: any) => (
          <div key={app.id} className="attendance-group-card">
            <div className="group-header">
              <div className="group-info">
                <span className="time-badge">{app.startTime} ~ {app.endTime}</span>
                <span className="room-badge">{app.room}</span>
                <span className="rep-info">대표: {app.representative}</span>
                <span className="skill-info">술기: {app.skills.join(', ')}</span>
              </div>
              <div className="group-actions no-print">
                <button 
                  className={`btn-small ${app.participants.every((p: any) => p.cleanupBad) ? 'btn-danger' : 'btn-outline'}`}
                  onClick={() => updateGroupCleanup(app.id, !app.participants.every((p: any) => p.cleanupBad))}
                  disabled={loading === `group-${app.id}`}
                >
                  조 전체 정리불량 처리
                </button>
              </div>
            </div>
            
            <div className="group-table">
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
                  {app.participants.map((p: any) => (
                    <tr key={p.id}>
                      <td>{p.studentId}</td>
                      <td style={{ fontWeight: '600' }}>{p.name}</td>
                      <td className="no-print">
                        <select 
                          value={p.attendanceStatus}
                          onChange={(e) => updateStatus(p.id, { attendanceStatus: e.target.value })}
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
                          className={`cleanup-btn ${p.cleanupBad ? 'bad' : 'good'}`}
                          onClick={() => updateStatus(p.id, { cleanupBad: !p.cleanupBad })}
                          disabled={loading === p.id}
                        >
                          {p.cleanupBad ? '❌ 정리불량' : '✅ 양호'}
                        </button>
                      </td>
                      <td className="print-only" style={{ width: '120px', height: '40px', border: '1px solid #ddd' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <style jsx global>{`
        .attendance-group-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .group-header {
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .group-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .time-badge {
          background: var(--primary);
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.875rem;
        }
        .room-badge {
          background: #e2e8f0;
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8125rem;
        }
        .rep-info {
          font-weight: 600;
          color: var(--text);
          font-size: 0.9375rem;
        }
        .skill-info {
          color: var(--sub-text);
          font-size: 0.875rem;
        }
        .group-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .group-table th {
          text-align: left;
          padding: 12px 20px;
          background: #fcfcfc;
          border-bottom: 1px solid var(--border);
          font-size: 0.75rem;
          color: var(--sub-text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .group-table td {
          padding: 12px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.9375rem;
        }
        .status-select {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
          font-size: 0.8125rem;
          font-weight: 600;
          outline: none;
        }
        .status-select.PRESENT { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
        .status-select.ABSENT { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .status-select.LATE_30 { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        
        .cleanup-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cleanup-btn.good { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
        .cleanup-btn.bad { background: #ef4444; color: white; border-color: #ef4444; }
        
        .btn-danger { background: #ef4444; color: white; border: none; }
        
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: table-cell !important; }
          .attendance-group-card { border: 1px solid #000; break-inside: avoid; }
          .group-header { border-bottom: 1px solid #000; background: none !important; }
          .time-badge { border: 1px solid #000; color: #000 !important; background: none !important; }
          .room-badge { border: 1px solid #000; color: #000 !important; background: none !important; }
        }
      `}</style>
    </div>
  );
}
