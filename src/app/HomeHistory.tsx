'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeHistory() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history?limit=5')
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

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>불러오는 중...</div>;

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--sub-text)' }}>
        <p style={{ fontSize: '0.875rem' }}>로그인 후 신청 내역을 확인할 수 있습니다.</p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700', marginTop: '12px', display: 'inline-block' }}>로그인 →</Link>
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
    <div className="home-history-list">
      {data.map(app => (
        <Link href={`/history/${app.id}`} key={app.id} className="history-item-mini">
          <div className="item-main">
            <span className="item-date">{new Date(app.slot.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
            <span className="item-time">{app.slot.startTime}</span>
          </div>
          <span className={`mini-badge ${app.status.toLowerCase()}`}>
            {getStatusText(app.status)}
          </span>
        </Link>
      ))}
      <Link href="/history" className="view-more">전체 내역 보기 →</Link>

      <style jsx>{`
        .home-history-list {
          display: flex;
          flex-direction: column;
        }
        .history-item-mini {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          transition: background 0.2s;
        }
        .history-item-mini:hover {
          background: #f8fafc;
        }
        .history-item-mini:last-of-type {
          border-bottom: none;
        }
        .item-main {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .item-date {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text);
        }
        .item-time {
          font-size: 0.8125rem;
          color: var(--sub-text);
        }
        .mini-badge {
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .mini-badge.pending { background: #e6f0ff; color: #0052cc; }
        .mini-badge.approved { background: #dcfce7; color: #166534; }
        .mini-badge.rejected { background: #fee2e2; color: #991b1b; }
        .mini-badge.completed { background: #f1f5f9; color: #475569; }
        .mini-badge.cancelled { background: #f1f5f9; color: #94a3b8; }
        
        .view-more {
          padding: 12px;
          text-align: center;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          border-top: 1px solid #f1f5f9;
        }
        .view-more:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
