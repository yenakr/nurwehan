'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  applicationId: string;
  currentStatus: string;
  rejectedReason: string | null;
  hasUsageLog: boolean;
  participants: any[];
}

export default function ApplicationStatusActions({ 
  applicationId, 
  currentStatus, 
  rejectedReason,
  hasUsageLog,
  participants
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusUpdate = async (status: string) => {
    let reason = null;
    if (status === 'REJECTED') {
      reason = prompt('반려 사유를 입력해주세요:');
      if (reason === null) return;
      if (!reason.trim()) {
        alert('반려 사유를 입력해야 합니다.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectedReason: reason }),
      });

      if (res.ok) {
        alert('상태가 변경되었습니다.');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || '상태 변경 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
      {currentStatus === 'PENDING' ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '12px 40px' }}
            disabled={loading}
            onClick={() => handleStatusUpdate('APPROVED')}
          >
            {loading ? '처리 중...' : '신청 승인'}
          </button>
          <button 
            className="btn-outline" 
            style={{ padding: '12px 40px', color: '#ef4444', borderColor: '#ef4444' }}
            disabled={loading}
            onClick={() => handleStatusUpdate('REJECTED')}
          >
            반려하기
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '16px' }}>처리 완료</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>출석 및 정리 상태</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8125rem' }}>
                {participants.map(p => (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: '600' }}>
                      {p.attendanceStatus === 'PRESENT' ? '✅ 출석' : 
                       p.attendanceStatus === 'ABSENT' ? '❌ 불참' : 
                       p.attendanceStatus === 'LATE_30' ? '⚠️ 지각' : '대기'}
                      {p.cleanupBad && ' (🧹 불량)'}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={`/admin/attendance?appId=${applicationId}`} style={{ display: 'inline-block', marginTop: '12px', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '600' }}>
                출석부에서 관리하기 →
              </Link>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>사용일지 제출 여부</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
                  backgroundColor: hasUsageLog ? '#dcfce7' : '#fee2e2',
                  color: hasUsageLog ? '#166534' : '#991b1b'
                }}>
                  {hasUsageLog ? '제출 완료' : '미제출'}
                </span>
              </div>
              {hasUsageLog && (
                <Link href={`/admin/usage-logs?applicationId=${applicationId}`} style={{ display: 'inline-block', marginTop: '12px', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '600' }}>
                  사용일지 확인하기 →
                </Link>
              )}
            </div>
          </div>

          {currentStatus === 'REJECTED' && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '4px' }}>
              반려 사유: {rejectedReason}
            </div>
          )}

          <button 
            className="btn-outline" 
            onClick={() => router.push('/admin/applications')}
          >
            목록으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
