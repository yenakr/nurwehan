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
        <p style={{ fontSize: '0.875rem' }}>로그인 필요</p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.8125rem', marginTop: '8px', display: 'inline-block' }}>로그인</Link>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--sub-text)' }}>
        <p style={{ fontSize: '0.875rem' }}>작성 내역 없음</p>
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
        <Link href="/history" className="view-all-link">전체 작성 내역 보기 →</Link>
      </div>

      <style jsx>{`
        .home-history-container {
          display: flex;
          flex-direction: column;
          padding: 8px 4px;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .history-row {
          display: flex;
          align-items: center;
          padding: 16px 12px;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          transition: all 0.2s;
          border-radius: 12px;
        }
        .history-row:hover {
          background: #f8fafc;
          transform: translateX(4px);
        }
        .history-row:last-child {
          border-bottom: none;
        }
        
        .row-content {
          display: flex;
          align-items: center;
          gap: 20px;
          overflow: hidden;
          width: 100%;
        }
        .info-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
          flex: 1;
        }

        .status-dot {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          min-width: 44px;
          text-align: center;
          flex-shrink: 0;
          letter-spacing: -0.02em;
        }
        .status-dot.pending { background: #fef9c3; color: #a16207; }
        .status-dot.approved { background: #dcfce7; color: #15803d; }
        .status-dot.rejected { background: #fee2e2; color: #b91c1c; }
        .status-dot.completed { background: #f1f5f9; color: #475569; }
        .status-dot.cancelled { background: #f1f5f9; color: #94a3b8; }

        .date-time {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          letter-spacing: -0.01em;
        }
        
        .divider {
          color: #e2e8f0;
          font-size: 0.875rem;
          font-weight: 300;
        }

        .skill-name {
          font-size: 0.875rem;
          color: var(--sub-text);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .view-all-container {
          margin-top: 20px;
          padding-right: 12px;
          text-align: right;
        }
        .view-all-link {
          font-size: 0.875rem;
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
            padding: 16px 8px;
          }
          .row-content {
            gap: 12px;
          }
          .info-wrap {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .divider {
            display: none;
          }
          .skill-name {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}
