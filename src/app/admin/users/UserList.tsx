'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

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
  createdAt: string;
  restrictions: Restriction[];
  warnings: CleanupWarning[];
}

export default function UserList({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL' | 'RESTRICTED'>('ALL');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending') setActiveTab('PENDING');
    else if (tab === 'restricted') setActiveTab('RESTRICTED');
  }, [searchParams]);

  const handleStatusUpdate = async (id: string, status: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status }),
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

  return (
    <div className="users-management">
      <div className="management-header">
        <div className="tabs no-print">
          <button className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>
            전체 학생 ({users.length})
          </button>
          <button className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`} onClick={() => setActiveTab('PENDING')}>
            가입 대기 ({users.filter(u => u.approvalStatus === 'PENDING').length})
          </button>
          <button className={`tab-btn ${activeTab === 'RESTRICTED' ? 'active' : ''}`} onClick={() => setActiveTab('RESTRICTED')}>
            참여 불가 ({users.filter(u => u.restrictions.length > 0).length})
          </button>
        </div>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="이름 또는 학번 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'PENDING' && (
          <div className="user-section">
             <table className="admin-table">
               <thead>
                 <tr>
                   <th>학생 정보</th>
                   <th>학년</th>
                   <th>연락처</th>
                   <th>작업</th>
                 </tr>
               </thead>
               <tbody>
                 {pendingUsers.map(user => (
                   <tr key={user.id}>
                     <td>
                        <div className="user-id-name">
                          <span className="name">{user.name}</span>
                          <span className="id">{user.studentId}</span>
                        </div>
                     </td>
                     <td>{user.grade}학년</td>
                     <td>{user.phone || '-'}</td>
                     <td>
                        <div className="action-btns">
                          <button onClick={() => handleStatusUpdate(user.id, 'APPROVED')} disabled={loading === user.id} className="btn-approve">승인</button>
                        </div>
                     </td>
                   </tr>
                 ))}
                 {pendingUsers.length === 0 && <tr><td colSpan={4} className="empty-td">대기 중인 학생이 없습니다.</td></tr>}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'RESTRICTED' && (
          <div className="user-section">
             <table className="admin-table">
               <thead>
                 <tr>
                   <th>학생 정보</th>
                   <th>학년</th>
                   <th>누적 페널티</th>
                   <th>불가 사유</th>
                   <th>불가 기간</th>
                 </tr>
               </thead>
               <tbody>
                 {restrictedUsers.map(user => (
                   <tr key={user.id}>
                     <td>
                        <div className="user-id-name">
                          <span className="name">{user.name}</span>
                          <span className="id">{user.studentId}</span>
                        </div>
                     </td>
                     <td>{user.grade}학년</td>
                     <td>
                        <div className="penalty-status">
                           {user.warnings.length > 0 && (
                             <span className={`penalty-badge cleanup ${user.warnings.length >= 3 ? 'critical' : ''}`}>
                               정리불량 누적 {user.warnings.length}회
                             </span>
                           )}
                           {user.warnings.length === 0 && <span className="clean-status">-</span>}
                        </div>
                     </td>
                     <td>
                        {user.restrictions.map(r => (
                          <div key={r.id} className="penalty-tag red">{r.reason}</div>
                        ))}
                     </td>
                     <td>
                        {user.restrictions.map(r => (
                          <div key={r.id} className="penalty-date">
                            ~ {format(new Date(r.endDate), 'yyyy.MM.dd')}
                          </div>
                        ))}
                     </td>
                   </tr>
                 ))}
                 {restrictedUsers.length === 0 && <tr><td colSpan={5} className="empty-td">참여 불가 학생이 없습니다.</td></tr>}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'ALL' && (
          <div className="grade-groups">
            {sortedGrades.map(grade => (
              <div key={grade} className="grade-group">
                <h3 className="grade-title">{grade === 0 ? '기타/학년미지정' : `${grade}학년`}</h3>
                <div className="user-section">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>학번/이름</th>
                        <th>학년 수정</th>
                        <th style={{ width: '200px' }}>누적 페널티</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByGrade[grade].map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-id-name">
                              <span className="name">{user.name}</span>
                              <span className="id">{user.studentId}</span>
                            </div>
                          </td>
                          <td>
                            <select 
                              className="grade-select"
                              value={user.grade || ''} 
                              onChange={(e) => handleGradeUpdate(user.id, Number(e.target.value))}
                              disabled={loading === user.id}
                            >
                              <option value="">학년 선택</option>
                              <option value="1">1학년</option>
                              <option value="2">2학년</option>
                              <option value="3">3학년</option>
                              <option value="4">4학년</option>
                            </select>
                          </td>
                          <td>
                            <div className="penalty-status">
                              {user.warnings.length > 0 && (
                                <span className={`penalty-badge cleanup ${user.warnings.length >= 3 ? 'critical' : ''}`}>
                                  정리불량 {user.warnings.length}회
                                </span>
                              )}
                              {user.restrictions.length > 0 && (
                                <span className="penalty-badge absent">참여 제한 중</span>
                              )}
                              {user.warnings.length === 0 && user.restrictions.length === 0 && <span className="clean-status">기록 없음</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${user.approvalStatus.toLowerCase()}`}>
                              {user.approvalStatus === 'APPROVED' ? '승인완료' : user.approvalStatus === 'PENDING' ? '대기' : '정지'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .users-management { padding: 0; font-family: 'Pretendard', sans-serif; }
        
        .management-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-bar {
          flex: 1;
          min-width: 280px;
          max-width: 400px;
        }
        .search-bar input {
          width: 100%;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.2s;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .search-bar input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
        }

        .tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 6px; border-radius: 14px; width: fit-content; }
        .tab-btn { 
          padding: 10px 24px; 
          border: none; 
          background: transparent; 
          border-radius: 10px; 
          font-size: 0.9375rem; 
          font-weight: 700; 
          color: #64748b; 
          cursor: pointer; 
          transition: all 0.2s; 
        }
        .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }

        .grade-group { margin-bottom: 48px; }
        .grade-title { font-size: 1.25rem; font-weight: 900; color: #1e293b; margin-bottom: 20px; padding-left: 14px; border-left: 5px solid var(--primary); letter-spacing: -0.02em; }

        .user-section { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 0.8125rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.05em; }
        .admin-table td { padding: 18px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        
        .user-id-name { display: flex; flex-direction: column; gap: 2px; }
        .user-id-name .name { font-size: 1rem; font-weight: 800; color: #1e293b; }
        .user-id-name .id { font-size: 0.8125rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-weight: 500; }

        .grade-select { 
          padding: 8px 12px; 
          border: 1px solid #e2e8f0; 
          border-radius: 10px; 
          font-size: 0.875rem; 
          font-weight: 600; 
          outline: none; 
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s;
        }
        .grade-select:focus { border-color: var(--primary); background: white; }

        .penalty-status { display: flex; gap: 8px; flex-wrap: wrap; }
        .penalty-badge { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
        .penalty-badge::before { content: '⚠️'; font-size: 0.7rem; }
        .penalty-badge.cleanup { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
        .penalty-badge.cleanup.critical { background: #7f1d1d; color: white; border-color: #7f1d1d; box-shadow: 0 2px 4px rgba(127, 29, 29, 0.2); }
        .penalty-badge.absent { background: #ffedd5; color: #f59e0b; border: 1px solid #fed7aa; }
        .clean-status { font-size: 0.8125rem; color: #94a3b8; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .clean-status::before { content: '✅'; font-size: 0.7rem; }

        .status-badge { font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; border: 1px solid transparent; }
        .status-badge.approved { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .status-badge.pending { background: #fef9c3; color: #a16207; border-color: #fef08a; }
        .status-badge.rejected { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

        .penalty-tag { font-size: 0.875rem; font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .penalty-tag::before { content: '🚫'; font-size: 0.8rem; }
        .penalty-tag.red { color: #ef4444; }
        .penalty-date { font-size: 0.8125rem; color: #64748b; margin-bottom: 4px; font-weight: 500; padding-left: 24px; }

        .btn-approve { background: var(--primary); color: white; border: none; padding: 8px 18px; border-radius: 10px; font-size: 0.875rem; font-weight: 800; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 112, 243, 0.2); }
        .btn-approve:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 10px -1px rgba(0, 112, 243, 0.3); }
        .btn-approve:active { transform: translateY(0); }
        .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .empty-td { text-align: center; color: #94a3b8; padding: 60px !important; font-size: 1rem; font-weight: 500; }

        @media (max-width: 768px) {
          .management-header { flex-direction: column; align-items: stretch; }
          .search-bar { max-width: none; }
          .tabs { width: 100%; overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}
