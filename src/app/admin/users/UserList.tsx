'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  studentId: string;
  name: string;
  grade: number | null;
  email: string | null;
  phone: string | null;
  approvalStatus: string;
  createdAt: Date;
}

export default function UserList({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (id: string, status: string) => {
    let reason = null;
    if (status === 'REJECTED') {
      reason = prompt('반려 사유를 입력해주세요:');
      if (reason === null) return;
    }

    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status, rejectedReason: reason }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, approvalStatus: status } : u));
        router.refresh();
      } else {
        alert('처리에 실패했습니다.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const pendingUsers = users.filter(u => u.approvalStatus === 'PENDING');
  const otherUsers = users.filter(u => u.approvalStatus !== 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>
          승인 대기 목록 ({pendingUsers.length})
        </h2>
        <div className="table-container card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학번/이름</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학년</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>연락처</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length > 0 ? pendingUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{user.studentId}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{user.grade}학년</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem' }}>{user.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{user.phone}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleAction(user.id, 'APPROVED')}
                        disabled={loading === user.id}
                        className="btn-primary" 
                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                      >
                        승인
                      </button>
                      <button 
                        onClick={() => handleAction(user.id, 'REJECTED')}
                        disabled={loading === user.id}
                        className="btn-outline" 
                        style={{ padding: '4px 12px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--sub-text)', fontSize: '0.875rem' }}>대기 중인 학생이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '16px' }}>전체 학생 목록</h2>
        <div className="table-container card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>이름</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학번</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>상태</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>가입일</th>
              </tr>
            </thead>
            <tbody>
              {otherUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: '500' }}>{user.name}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{user.studentId}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                    <span className={`badge badge-${user.approvalStatus.toLowerCase()}`}>
                      {user.approvalStatus === 'APPROVED' ? '승인' : user.approvalStatus === 'REJECTED' ? '반려' : '중지'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
