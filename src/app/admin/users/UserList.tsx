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
  checklist?: boolean;
  ehr?: boolean;
  prof?: boolean;
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
  const [tmpPw, setTmpPw] = useState<{ id: string; pw: string } | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [group, setGroup] = useState<'student' | 'staff'>('student');
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

  const handleEhrUpdate = async (id: string, on: boolean) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ehr: on }),
      });
      if (res.ok) setUsers(users.map(u => (u.id === id ? { ...u, ehr: on } : u)));
      else alert('저장하지 못했습니다.');
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleChecklistUpdate = async (id: string, on: boolean) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: on }),
      });
      if (res.ok) setUsers(users.map(u => (u.id === id ? { ...u, checklist: on } : u)));
      else alert('저장하지 못했습니다.');
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleResetPw = async (id: string) => {
    setLoading(id);
    setResetId(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.password) setTmpPw({ id, pw: j.password });
      else alert(j.message || '초기화하지 못했습니다.');
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
    let filtered = users.filter(u => (group === 'staff') === !(u.role === 'STUDENT' || !u.role));
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(lowerSearch) || 
        u.studentId.includes(lowerSearch)
      );
    }
    return filtered;
  }, [users, searchTerm, group]);

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
          <button className={activeTab === 'ALL' && group === 'student' ? 'on' : ''} onClick={() => { setActiveTab('ALL'); setGroup('student'); }}>
            학생 {users.filter(u => u.role === 'STUDENT' || !u.role).length}
          </button>
          {users.some(u => u.role && u.role !== 'STUDENT') && (
            <button className={activeTab === 'ALL' && group === 'staff' ? 'on' : ''} onClick={() => { setActiveTab('ALL'); setGroup('staff'); }}>
              교수·관리 {users.filter(u => u.role && u.role !== 'STUDENT').length}
            </button>
          )}
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
          {pendingUsers.length === 0 && <div className="empty">대기 중인 학생이 없어요.</div>}
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
                  <div className="top">
                    <span className="name">{user.name}</span>
                    <span className="sid">{user.studentId}</span>
                    <span className={`st ${user.approvalStatus.toLowerCase()}`}>{statusLabel(user.approvalStatus)}</span>
                    {user.prof && (user.role === 'STUDENT' || !user.role) && <span className="bd pf">교수 신청</span>}
                    {user.checklist && <span className="bd">체크</span>}
                    {user.ehr && <span className="bd">EHR</span>}
                    {user.tier === 1 && <span className="bd">일부공개</span>}
                  </div>
                  <button type="button" className="rst" onClick={() => setOpenId(openId === user.id ? null : user.id)}>{openId === user.id ? '닫기' : '설정'}</button>
                  {openId === user.id && <div className="ctl">
                  {superAdmin && (
                    <select
                      value={user.role === 'STUDENT' || !user.role ? 'STUDENT' : 'ADMIN'}
                      onChange={e => handleRoleUpdate(user.id, e.target.value)}
                      disabled={loading === user.id}
                      aria-label="권한"
                    >
                      <option value="STUDENT">학생</option>
                      <option value="ADMIN">교수·관리자</option>
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
                  {superAdmin && user.approvalStatus === 'APPROVED' && (
                    <select
                      value={user.checklist ? 1 : 0}
                      onChange={e => handleChecklistUpdate(user.id, e.target.value === '1')}
                      disabled={loading === user.id}
                      aria-label="체크리스트"
                    >
                      <option value={0}>체크 끔</option>
                      <option value={1}>체크 사용</option>
                    </select>
                  )}
                  {superAdmin && user.approvalStatus === 'APPROVED' && (
                    <select
                      value={user.ehr ? 1 : 0}
                      onChange={e => handleEhrUpdate(user.id, e.target.value === '1')}
                      disabled={loading === user.id}
                      aria-label="EHR"
                    >
                      <option value={0}>EHR 끔</option>
                      <option value={1}>EHR 사용</option>
                    </select>
                  )}
                  <select
                    value={user.grade || ''}
                    onChange={e => handleGradeUpdate(user.id, Number(e.target.value))}
                    disabled={loading === user.id}
                    aria-label="학년"
                  >
                    <option value="">학년</option>
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                    <option value="4">4학년</option>
                  </select>
                  {(superAdmin || user.role === 'STUDENT' || !user.role) && (
                    resetId === user.id ? (
                      <button type="button" className="rst on" onClick={() => handleResetPw(user.id)} disabled={loading === user.id}>초기화 확인</button>
                    ) : (
                      <button type="button" className="rst" onClick={() => setResetId(user.id)} disabled={loading === user.id}>비번</button>
                    )
                  )}
                  </div>}
                  {tmpPw && tmpPw.id === user.id && (
                    <div className="tmp">
                      <span>임시 비밀번호</span>
                      <b>{tmpPw.pw}</b>
                      <button type="button" onClick={() => { navigator.clipboard?.writeText(tmpPw.pw).catch(() => {}); }}>복사</button>
                      <button type="button" onClick={() => setTmpPw(null)}>닫기</button>
                    </div>
                  )}
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
        .row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-top: 1px solid #f1f5f9; }
        .row.pending { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
        .top { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .top .name { white-space: nowrap; }
        .top .sid { font-size: 0.8125rem; color: #94a3b8; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .top .st { align-self: center; flex: 0 0 auto; }
        .ctl { display: flex; flex-wrap: wrap; gap: 6px; flex: 0 0 auto; }
        .ctl { flex: 1 1 100%; padding-top: 4px; }
        .ctl select { min-width: 0; }
        .row:not(.pending) { flex-wrap: wrap; }
        .rst { padding: 5px 9px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 0.8125rem; font-weight: 700; color: #475569; cursor: pointer; white-space: nowrap; }
        .rst.on { color: #ef4444; border-color: #fecaca; }
        .tmp { flex: 1 1 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: #f1f5f9; font-size: 0.8125rem; }
        .tmp span { color: #64748b; }
        .tmp b { font-family: ui-monospace, monospace; font-size: 0.9375rem; letter-spacing: 0.04em; user-select: all; }
        .tmp button { margin-left: auto; border: 0; background: none; color: var(--primary); font: inherit; font-weight: 700; cursor: pointer; }
        .tmp b + button { margin-left: auto; }
        .tmp button + button { margin-left: 0; color: #64748b; }
        .row:first-child { border-top: none; }
                .name { font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 6px; }
        .sub { font-size: 0.8125rem; color: #94a3b8; margin-top: 2px; word-break: break-all; }
        .st { font-size: 0.6875rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; }
        .bd { font-size: 0.6875rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: #eef2f7; color: #475569; white-space: nowrap; }
        .bd.pf { background: #ede9fe; color: #6d28d9; }
        .top { flex-wrap: wrap; }
        .st.approved { background: #dcfce7; color: #15803d; }
        .st.pending { background: #fef9c3; color: #a16207; }
        .st.rejected { background: #fee2e2; color: #b91c1c; }
        .who { flex: 1; min-width: 0; }
        .row select { padding: 5px 6px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-size: 0.8125rem; }
        .btns { display: flex; gap: 8px; flex: 0 0 auto; }
        .btns button { padding: 9px 16px; border-radius: 9px; font-size: 0.875rem; font-weight: 800; cursor: pointer; border: 1px solid transparent; white-space: nowrap; }
        .btns .ok { background: var(--primary); color: #fff; }
        .btns .no { background: #fff; color: #ef4444; border-color: #fecaca; }
        .btns button:disabled { opacity: 0.5; }
        .empty { text-align: center; color: #94a3b8; padding: 40px 12px; }
        @media (max-width: 560px) {
          .row:not(.pending) { flex-wrap: wrap; gap: 6px; padding: 10px 12px; }
          .row:not(.pending) .top { flex: 1 1 100%; }
          .ctl { flex: 1 1 100%; }
          .ctl select { flex: 1 1 40%; }
          .row.pending { flex-direction: column; align-items: stretch; }
          .row.pending .btns button { flex: 1; padding: 11px; }
        }
      `}</style>
    </div>
  );
}
