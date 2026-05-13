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

  const updateStatus = async (participantId: string, updates: any) => {
    setLoading(participantId);
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, ...updates })
      });
      if (res.ok) {
        const updatedParticipant = await res.json();
        setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, ...updates } : p));
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="no-print" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => router.push(`/admin/attendance?date=${e.target.value}`)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
            총 {participants.length}명 신청
          </span>
        </div>
        <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🖨️</span> 일일 명단 인쇄
        </button>
      </div>

      <div className="print-only" style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>OPEN LAB 출석 및 서명부 ({selectedDate})</h1>
      </div>

      <div className="card table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', fontSize: '0.8125rem' }}>시간/실습실</th>
              <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학생 정보</th>
              <th style={{ padding: '12px', fontSize: '0.8125rem' }}>술기</th>
              <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }} className="no-print">출석 상태</th>
              <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }} className="no-print">정리 상태</th>
              <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }} className="print-only-cell">서명</th>
            </tr>
          </thead>
          <tbody>
            {participants.length > 0 ? participants.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{p.application.slot.startTime} ~ {p.application.slot.endTime}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{p.application.slot.room}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{p.studentId}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem' }}>
                    {p.application.skills.map(s => s.skill.name).join(', ')}
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }} className="no-print">
                  <select 
                    value={p.attendanceStatus} 
                    disabled={loading === p.id}
                    onChange={(e) => updateStatus(p.id, { attendanceStatus: e.target.value })}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '0.75rem', 
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      backgroundColor: p.attendanceStatus === 'ABSENT' ? '#fee2e2' : 'white',
                      color: p.attendanceStatus === 'ABSENT' ? '#ef4444' : 'inherit'
                    }}
                  >
                    <option value="PENDING">대기</option>
                    <option value="PRESENT">출석</option>
                    <option value="ABSENT">결석</option>
                    <option value="LATE_30">30분 지각</option>
                  </select>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }} className="no-print">
                  <button
                    disabled={loading === p.id}
                    onClick={() => updateStatus(p.id, { cleanupBad: !p.cleanupBad })}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      borderRadius: '20px',
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: p.cleanupBad ? '#ef4444' : 'white',
                      color: p.cleanupBad ? 'white' : '#6b7280',
                      borderColor: p.cleanupBad ? '#ef4444' : '#d1d5db'
                    }}
                  >
                    {p.cleanupBad ? '정리불량' : '양호'}
                  </button>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }} className="print-only-cell">
                  {/* Empty for signature */}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>해당 날짜에 승인된 신청 내역이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .container { max-width: 100% !important; padding: 0 !important; }
          .card { border: none !important; box-shadow: none !important; }
          body { background: white !important; }
          table { border: 1px solid #000 !important; }
          th, td { border: 1px solid #000 !important; }
          .print-only-cell { width: 100px; }
        }
        .print-only-cell { display: none; }
        @media print {
          .print-only-cell { display: table-cell !important; }
        }
      `}</style>
    </div>
  );
}
