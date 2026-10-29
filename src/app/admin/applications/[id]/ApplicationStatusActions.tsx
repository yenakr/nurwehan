'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  applicationId: string;
  currentStatus: string;
  participants: any[];
}

export default function ApplicationStatusActions({ 
  applicationId, 
  currentStatus, 
  participants
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusUpdate = async (status: string) => {
    const reason = prompt('취소 사유를 입력해주세요 (운영 일정 변경 등):');
    if (reason === null) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          cancelReason: reason
        }),
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

  const handleDelete = async () => {
    if (!confirm('정말로 이 신청 내역을 완전히 삭제하시겠습니까? 관련 참여 정보 및 일지가 모두 삭제되며 복구할 수 없습니다.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('삭제되었습니다.');
        router.push('/admin/applications');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
      {(
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>관리</h3>
            {currentStatus !== 'CANCELLED' && (
              <button 
                className="btn-small btn-outline" 
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                disabled={loading}
                onClick={() => handleStatusUpdate('CANCELLED')}
              >
                신청서 취소
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>출석 및 정리 상태</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8125rem' }}>
                {participants.map(p => (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: '600' }}>
                      {p.attendanceStatus === 'PRESENT' ? '출석' : 
                       p.attendanceStatus === 'ABSENT' ? '불참' : 
                       p.attendanceStatus === 'LATE_30' ? '지각' : '대기'}
                      {p.cleanupBad && ' (청소 불량)'}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={`/admin/attendance?appId=${applicationId}`} style={{ display: 'inline-block', marginTop: '12px', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '600' }}>
                출석부에서 관리하기 →
              </Link>
            </div>
          </div>

          {currentStatus === 'CANCELLED' && (
            <div style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '16px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '4px' }}>
              취소 상태입니다.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <button 
              className="btn-outline" 
              onClick={() => router.push('/admin/applications')}
            >
              목록으로 돌아가기
            </button>
            <button 
              className="btn-outline" 
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
              onClick={handleDelete}
              disabled={loading}
            >
              내역 영구 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
