'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeHistory() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only 3 items as requested
    fetch('/api/history?limit=3')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '대기';
      case 'APPROVED': return '승인';
      case 'REJECTED': return '반려';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('ko-KR', { 
      month: 'numeric', 
      day: 'numeric', 
      weekday: 'short' 
    }).replace(/ /g, '');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--sub-text)', fontSize: '0.8125rem' }}>불러오는 중...</div>;

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--sub-text)' }}>
        <p style={{ fontSize: '0.875rem' }}>로그인 후 내역 확인이 가능합니다.</p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.8125rem', marginTop: '8px', display: 'inline-block' }}>로그인 →</Link>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--sub-text)' }}>
        <p style={{ fontSize: '0.875rem' }}>최근 신청 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="home-history-container">
      <div className="history-list">
        {data.map(app => (
          <Link href={`/history/${app.id}`} key={app.id} className="history-row">
            <div className="row-left">
              <span className={`status-dot ${app.status.toLowerCase()}`}>
                {getStatusText(app.status)}
              </span>
              <span className="date-time">
                {formatDate(app.slot.date)} {app.slot.startTime}
              </span>
            </div>
            <div className="row-right">
              <span className="room-name">{app.slot.room}</span>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="view-all-container">
        <Link href="/history" className="view-all-link">전체 내역 보기 →</Link>
      </div>

      <style jsx>{`
        .home-history-container {
          display: flex;
          flex-direction: column;
        }
        .history-list {
          display: flex;
          flex-direction: column;
        }
        .history-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 4px;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          transition: all 0.2s;
          gap: 12px;
        }
        .history-row:hover {
          background: #fcfcfc;
          padding-left: 8px;
        }
        .history-row:last-child {
          border-bottom: none;
        }
        
        .row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .row-right {
          text-align: right;
          flex-shrink: 0;
        }

        .status-dot {
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          min-width: 36px;
          text-align: center;
        }
        /* 상태별 색상 (사용자 요구사항 반영) */
        .status-dot.pending { background: #fef9c3; color: #a16207; } /* 노랑 */
        .status-dot.approved { background: #dcfce7; color: #15803d; } /* 초록 */
        .status-dot.rejected { background: #fee2e2; color: #b91c1c; } /* 빨강 */
        .status-dot.completed { background: #f1f5f9; color: #475569; } /* 회색 */
        .status-dot.cancelled { background: #f1f5f9; color: #94a3b8; } /* 회색 */

        .date-time {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        
        .room-name {
          font-size: 0.8125rem;
          color: var(--sub-text);
          font-weight: 500;
        }

        .view-all-container {
          margin-top: 12px;
          text-align: right;
        }
        .view-all-link {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          display: inline-block;
          padding: 4px 0;
          transition: transform 0.2s;
        }
        .view-all-link:hover {
          transform: translateX(4px);
        }

        @media (max-width: 480px) {
          .history-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            padding: 12px 8px;
          }
          .row-right {
            padding-left: 48px;
          }
        }
      `}</style>
    </div>
  );
}
