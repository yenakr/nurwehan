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

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>불러오는 중...</div>;

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>
        <p style={{ fontSize: '0.875rem' }}>로그인 후 내 신청 내역을 확인할 수 있습니다.</p>
        <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '12px', display: 'inline-block' }}>로그인하기</Link>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>
        <p>최근 신청 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>날짜</th>
            <th>시간</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {data.map(app => (
            <tr key={app.id}>
              <td>{new Date(app.slot.date).toLocaleDateString('ko-KR')}</td>
              <td>{app.slot.startTime}</td>
              <td>
                <span className={`badge badge-${app.status.toLowerCase()}`}>
                  {app.status === 'PENDING' ? '승인대기' : 
                   app.status === 'APPROVED' ? '승인완료' : 
                   app.status === 'REJECTED' ? '반려' : app.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
