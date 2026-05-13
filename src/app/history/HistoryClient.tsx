'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HistoryClientProps {
  initialApplications: any[];
  currentUser: any;
}

export default function HistoryClient({ initialApplications, currentUser }: HistoryClientProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '승인 대기';
      case 'APPROVED': return '승인 완료';
      case 'REJECTED': return '반려됨';
      case 'COMPLETED': return '이용 완료';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  const handleCancel = async (appId: string) => {
    if (!confirm('정말로 신청을 취소하시겠습니까?')) return;
    
    setLoading(appId);
    try {
      const res = await fetch(`/api/open-lab/apply/${appId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('취소되었습니다.');
        setApplications(prev => prev.map(app => 
          app.id === appId ? { ...app, status: 'CANCELLED' } : app
        ));
      } else {
        const error = await res.json();
        alert(error.message || '취소 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="history-list">
      {applications.length === 0 ? (
        <div className="empty-state">
          신청 내역이 없습니다.
        </div>
      ) : (
        applications.map(app => (
          <div key={app.id} className="history-card">
            <div className="card-header">
              <span className={`status-badge ${app.status.toLowerCase()}`}>
                {getStatusText(app.status)}
              </span>
              <span className="date-text">
                {new Date(app.slot.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
            </div>
            
            <div className="card-body">
              <div className="info-row">
                <span className="label">시간</span>
                <span className="value">{app.slot.startTime} ~ {app.slot.endTime}</span>
              </div>
              <div className="info-row">
                <span className="label">장소</span>
                <span className="value">{app.slot.room}</span>
              </div>
              <div className="info-row">
                <span className="label">술기</span>
                <span className="value">{app.skills.map((as: any) => as.skill.name).join(', ')}</span>
              </div>
              <div className="info-row">
                <span className="label">인원</span>
                <span className="value">{app.participants.length}명</span>
              </div>

              {app.status === 'REJECTED' && app.rejectedReason && (
                <div className="rejection-box">
                  <strong>반려 사유:</strong> {app.rejectedReason}
                </div>
              )}
              
              {app.status === 'CANCELLED' && app.cancelReason && (
                <div className="rejection-box">
                  <strong>취소 사유:</strong> {app.cancelReason}
                </div>
              )}
            </div>

            <div className="card-footer">
              <Link href={`/history/${app.id}`} className="btn-small btn-outline">상세보기</Link>
              
              {app.status === 'PENDING' && app.representativeUserId === currentUser.id && (
                <>
                  <Link href={`/open-lab/edit/${app.id}`} className="btn-small btn-outline">수정</Link>
                  <button 
                    onClick={() => handleCancel(app.id)} 
                    disabled={loading === app.id}
                    className="btn-small btn-danger-outline"
                  >
                    {loading === app.id ? '처리 중...' : '취소'}
                  </button>
                </>
              )}

              {(app.status === 'APPROVED' || app.status === 'COMPLETED') && app.usageLogs.length === 0 && (
                <Link href={`/usage-logs/new?applicationId=${app.id}`} className="btn-small btn-primary">사용일지 작성</Link>
              )}
              
              {app.usageLogs.length > 0 && (
                <span className="log-status">사용일지 제출 완료</span>
              )}
            </div>
          </div>
        ))
      )}

      <style jsx>{`
        .history-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        @media (max-width: 480px) {
          .history-list {
            grid-template-columns: 1fr;
          }
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border);
          color: var(--sub-text);
        }
        .history-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }
        .history-card:hover {
          transform: translateY(-2px);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .status-badge.pending { background: #e6f0ff; color: #0052cc; }
        .status-badge.approved { background: #dcfce7; color: #166534; }
        .status-badge.rejected { background: #fee2e2; color: #991b1b; }
        .status-badge.completed { background: #f1f5f9; color: #475569; }
        .status-badge.cancelled { background: #f1f5f9; color: #94a3b8; }
        
        .date-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
        }
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }
        .label {
          color: var(--sub-text);
        }
        .value {
          font-weight: 600;
          color: var(--text);
          text-align: right;
        }
        .rejection-box {
          margin-top: 8px;
          padding: 10px;
          background: #fff5f5;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: #c92a2a;
          border-left: 3px solid #ff8787;
        }
        .card-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn-small {
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-outline {
          border: 1px solid var(--border);
          color: var(--sub-text);
          background: white;
        }
        .btn-outline:hover {
          background: #f8fafc;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
        }
        .btn-danger-outline {
          border: 1px solid #ffc9c9;
          color: #fa5252;
          background: white;
        }
        .btn-danger-outline:hover {
          background: #fff5f5;
        }
        .log-status {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          margin-left: auto;
          align-self: center;
        }
      `}</style>
    </div>
  );
}
