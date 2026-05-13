'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  applicationId: string;
  currentStatus: string;
  rejectedReason: string | null;
}

export default function ApplicationStatusActions({ applicationId, currentStatus, rejectedReason }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusUpdate = async (status: string) => {
    let reason = null;
    if (status === 'REJECTED') {
      reason = prompt('반려 사유를 입력해주세요:');
      if (reason === null) return; // Cancelled prompt
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
    <div className="card" style={{ display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '3px solid var(--primary)' }}>
      {currentStatus === 'PENDING' ? (
        <>
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
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: '600', marginBottom: '8px' }}>이미 처리된 신청입니다.</p>
          {currentStatus === 'REJECTED' && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>반려 사유: {rejectedReason}</p>
          )}
          <button 
            className="btn-outline" 
            style={{ marginTop: '16px' }}
            onClick={() => router.push('/admin/applications')}
          >
            목록으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
