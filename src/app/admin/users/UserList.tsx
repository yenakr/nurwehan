'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Restriction {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
}

interface CleanupWarning {
  id: string;
  applicationId: string;
  createdAt: string;
}

interface User {
  id: string;
  studentId: string;
  name: string;
  grade: number | null;
  email: string | null;
  phone: string | null;
  approvalStatus: string;
  tier?: number;
  role?: string;
  createdAt: string;
  restrictions: Restriction[];
  warnings: CleanupWarning[];
}

export default function UserList({ initialUsers, superAdmin = false }: { initialUsers: User[]; superAdmin?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL' | 'RESTRICTED'>(
    initialUsers.some(u => u.approvalStatus === 'PENDING') ? 'PENDING' : 'ALL'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending') setActiveTab('PENDING');
    else if (tab === 'restricted') setActiveTab('RESTRICTED');
  }, [searchParams]);

  const handleStatusUpdate = async (id: string, status: string, reason?: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvalStatus: status,
          ...(reason && { rejectedReason: reason })
        }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, approvalStatus: status } : u));
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleGradeUpdate = async (id: string, newGrade: number) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: newGrade }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, grade: newGrade } : u));
      }
    } catch (err) {
      alert('학년 수정에 실패했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleTierUpdate = async (id: string, tier: number) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (res.ok) setUsers(users.map(u => (u.id === id ? { ...u, tier } : u)));
      else alert('저장하지 못했습니다.');
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleRoleUpdate = async (id: string, role: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) setUsers(users.map(u => (u.id === id ? { ...u, role } : u)));
      else alert('저장하지 못했습니다.');
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(lowerSearch) || 
        u.studentId.includes(lowerSearch)
      );
    }
    return filtered;
  }, [users, searchTerm]);

  const pendingUsers = filteredUsers.filter(u => u.approvalStatus === 'PENDING');
  const restrictedUsers = filteredUsers.filter(u => u.restrictions.length > 0);
  
  const groupedByGrade = useMemo(() => {
    const groups: { [key: number]: User[] } = {};
    filteredUsers.forEach(u => {
      const g = u.grade || 0;
      if (!groups[g]) groups[g] = [];
      groups[g].push(u);
    });
    return groups;
  }, [filteredUsers]);

  const sortedGrades = Object.keys(groupedByGrade).map(Number).sort((a, b) => a - b);

  const pendingCount = users.filter(u => u.approvalStatus === 'PENDING').length;
  const statusLabel = (st: string) => (st === 'APPROVED' ? '승인' : st === 'PENDING' ? '대기' : '정지');

  return (
    <div className="um">
      <div className="head">
        <div className="tabs">
          <button className={activeTab === 'ALL' ? 'on' : ''} onClick={() => setActiveTab('ALL')}>
            전체 {users.length}
          </button>
          <button className={activeTab === 'PENDING' ? 'on' : ''} onClick={() => setActiveTab('PENDING')}>
            가입 대기 {pendingCount > 0 && <span className="dot">{pendingCount}</span>}
          </button>
        </div>
        <input
          className="search"
          type="text"
          placeholder="이름 또는 학번 검색"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {activeTab === 'PENDING' && (
        <div className="list">
          {pendingUsers.length === 0 && <div className="empty">대기 중인 학생이 없습니다.</div>}
          {pendingUsers.map(user => (
            <div key={user.id} className="row pending">
              <div className="who">
                <div className="name">{user.name}</div>
                <div className="sub">
                  {user.studentId} · {user.grade ? `${user.grade}학년` : '학년 미지정'}
                  {user.phone ? ` · ${user.phone}` : ''}
                </div>
              </div>
              <div className="btns">
                <button onClick={() => handleStatusUpdate(user.id, 'APPROVED')} disabled={loading === user.id} className="ok">
                  승인
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('반려 사유를 입력해주세요:');
                    if (reason) handleStatusUpdate(user.id, 'REJECTED', reason);
                  }}
                  disabled={loading === user.id}
                  className="no"
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ALL' &&
        sortedGrades.map(grade => (
          <section key={grade}>
            <h3 className="gtitle">
              {grade === 0 ? '학년 미지정' : `${grade}학년`} <span>{groupedByGrade[grade].length}</span>
            </h3>
            <div className="list">
              {groupedByGrade[grade].map(user => (
                <div key={user.id} className="row">
                  <div className="who">
                    <div className="name">
                      {user.name} <span className={`st ${user.approvalStatus.toLowerCase()}`}>{statusLabel(user.approvalStatus)}</span>
                    </div>
                    <div className="sub">{user.studentId}</div>
                  </div>
                  {superAdmin && (
                    <select
                      value={user.role === 'STUDENT' || !user.role ? 'STUDENT' : 'ADMIN'}
                      onChange={e => handleRoleUpdate(user.id, e.target.value)}
                      disabled={loading === user.id}
                      aria-label="권한"
                    >
                      <option value="STUDENT">학생</option>
                      <option value="ADMIN">관리자</option>
                    </select>
                  )}
                  {superAdmin && user.approvalStatus === 'APPROVED' && (
                    <select
                      value={user.tier ?? 0}
                      onChange={e => handleTierUpdate(user.id, Number(e.target.value))}
                      disabled={loading === user.id}
                      aria-label="열람 범위"
                    >
                      <option value={0}>일반</option>
                      <option value={1}>일부공개</option>
                    </select>
                  )}
                  <select
                    value={user.grade || ''}
                    onChange={e => handleGradeUpdate(user.id, Number(e.target.value))}
                    disabled={loading === user.id}
                    aria-label="학년"
                  >
                    <option value="">학년</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        ))}

      <style jsx>{`
        .um { display: flex; flex-direction: column; gap: 16px; }
        .head { display: flex; flex-direction: column; gap: 10px; }
        .tabs { display: inline-flex; align-self: flex-start; background: #f1f5f9; padding: 4px; border-radius: 12px; }
        .tabs button { padding: 8px 18px; border: none; background: transparent; border-radius: 9px; font-size: 0.9375rem; font-weight: 700; color: #64748b; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .tabs button.on { background: #fff; color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        .dot { background: #ef4444; color: #fff; border-radius: 999px; font-size: 0.75rem; padding: 1px 7px; }
        .search { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 0.9375rem; background: #fff; }
        .gtitle { font-size: 0.9375rem; font-weight: 800; color: #1e293b; margin: 8px 0 8px; }
        .gtitle span { color: var(--sub-text); font-weight: 600; margin-left: 4px; }
        .list { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-top: 1px solid #f1f5f9; }
        .row:first-child { border-top: none; }
        .who { min-width: 0; }
        .name { font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 6px; }
        .sub { font-size: 0.8125rem; color: #94a3b8; margin-top: 2px; word-break: break-all; }
        .st { font-size: 0.6875rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; }
        .st.approved { background: #dcfce7; color: #15803d; }
        .st.pending { background: #fef9c3; color: #a16207; }
        .st.rejected { background: #fee2e2; color: #b91c1c; }
        .who { flex: 1; min-width: 0; }
        .row select { padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.875rem; }
        .btns { display: flex; gap: 8px; flex: 0 0 auto; }
        .btns button { padding: 9px 16px; border-radius: 9px; font-size: 0.875rem; font-weight: 800; cursor: pointer; border: 1px solid transparent; white-space: nowrap; }
        .btns .ok { background: var(--primary); color: #fff; }
        .btns .no { background: #fff; color: #ef4444; border-color: #fecaca; }
        .btns button:disabled { opacity: 0.5; }
        .empty { text-align: center; color: #94a3b8; padding: 40px 12px; }
        @media (max-width: 480px) {
          .row.pending { flex-direction: column; align-items: stretch; }
          .row.pending .btns button { flex: 1; padding: 11px; }
        }
      `}</style>
    </div>
  );
}
