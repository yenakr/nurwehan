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
        {data.map(app => {
          const skillNames = [
            ...app.skills.map((s: any) => s.skill.name),
            ...(app.otherSkillName ? [app.otherSkillName] : [])
          ].join(', ');

          return (
            <Link href={`/history/${app.id}`} key={app.id} className="history-row">
              <div className="row-content">
                <span className={`status-dot ${app.status.toLowerCase()}`}>
                  {getStatusText(app.status)}
                </span>
                <div className="info-wrap">
                  <span className="date-time">
                    {formatDate(app.slot.date)} {app.slot.startTime}
                  </span>
                  <span className="divider">|</span>
                  <span className="skill-name">{skillNames || '기술 미지정'}</span>
                </div>
              </div>
            </Link>
          );
        })}
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
          align-items: center;
          padding: 12px 4px;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          transition: all 0.2s;
        }
        .history-row:hover {
          background: #fcfcfc;
          padding-left: 8px;
        }
        .history-row:last-child {
          border-bottom: none;
        }
        
        .row-content {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }
        .info-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .status-dot {
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          min-width: 36px;
          text-align: center;
          flex-shrink: 0;
        }
        .status-dot.pending { background: #fef9c3; color: #a16207; }
        .status-dot.approved { background: #dcfce7; color: #15803d; }
        .status-dot.rejected { background: #fee2e2; color: #b91c1c; }
        .status-dot.completed { background: #f1f5f9; color: #475569; }
        .status-dot.cancelled { background: #f1f5f9; color: #94a3b8; }

        .date-time {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
        }
        
        .divider {
          color: #e2e8f0;
          font-size: 0.75rem;
        }

        .skill-name {
          font-size: 0.8125rem;
          color: var(--sub-text);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          .info-wrap {
            flex-wrap: wrap;
            gap: 4px 8px;
          }
          .divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
