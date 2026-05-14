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

  const pendingUsers = users.filter(u => u.approvalStatus === 'PENDING');
  const restrictedUsers = users.filter(u => u.restrictions.length > 0);
  
  const groupedByGrade = useMemo(() => {
    const groups: { [key: number]: User[] } = {};
    users.forEach(u => {
      const g = u.grade || 0;
      if (!groups[g]) groups[g] = [];
      groups[g].push(u);
    });
    return groups;
  }, [users]);

  const sortedGrades = Object.keys(groupedByGrade).map(Number).sort((a, b) => a - b);

  return (
    <div className="users-management">
      <div className="tabs no-print">
        <button className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>전체 학생 ({users.length})</button>
        <button className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`} onClick={() => setActiveTab('PENDING')}>가입 대기 ({pendingUsers.length})</button>
        <button className={`tab-btn ${activeTab === 'RESTRICTED' ? 'active' : ''}`} onClick={() => setActiveTab('RESTRICTED')}>신청 제한 ({restrictedUsers.length})</button>
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
                   <th>제한 사유</th>
                   <th>제한 기간</th>
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
                 {restrictedUsers.length === 0 && <tr><td colSpan={4} className="empty-td">신청 제한 학생이 없습니다.</td></tr>}
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
                        <th>페널티 현황</th>
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
                              {user.restrictions.some(r => r.reason.includes('불참')) && (
                                <span className="penalty-badge absent">불참 제한 중</span>
                              )}
                              {user.warnings.length === 0 && user.restrictions.length === 0 && <span className="clean-status">정상</span>}
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
        
        .tabs { display: flex; gap: 8px; margin-bottom: 24px; background: #f1f5f9; padding: 6px; border-radius: 12px; width: fit-content; }
        .tab-btn { 
          padding: 10px 20px; 
          border: none; 
          background: transparent; 
          border-radius: 8px; 
          font-size: 0.875rem; 
          font-weight: 700; 
          color: #64748b; 
          cursor: pointer; 
          transition: all 0.2s; 
        }
        .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .grade-group { margin-bottom: 40px; }
        .grade-title { font-size: 1.125rem; font-weight: 900; color: #1e293b; margin-bottom: 16px; padding-left: 10px; border-left: 4px solid var(--primary); }

        .user-section { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { background: #f8fafc; padding: 12px 20px; text-align: left; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .admin-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        
        .user-id-name { display: flex; flex-direction: column; }
        .user-id-name .name { font-size: 0.9375rem; font-weight: 800; color: #1e293b; }
        .user-id-name .id { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

        .grade-select { 
          padding: 6px 10px; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 0.8125rem; 
          font-weight: 600; 
          outline: none; 
          background: #f8fafc;
          cursor: pointer;
        }
        .grade-select:focus { border-color: var(--primary); background: white; }

        .penalty-status { display: flex; gap: 8px; flex-wrap: wrap; }
        .penalty-badge { font-size: 0.6875rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
        .penalty-badge.cleanup { background: #fee2e2; color: #ef4444; }
        .penalty-badge.cleanup.critical { background: #7f1d1d; color: white; }
        .penalty-badge.absent { background: #ffedd5; color: #f59e0b; }
        .clean-status { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

        .status-badge { font-size: 0.6875rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; }
        .status-badge.approved { background: #dcfce7; color: #15803d; }
        .status-badge.pending { background: #fef9c3; color: #a16207; }
        .status-badge.rejected { background: #fee2e2; color: #b91c1c; }

        .penalty-tag { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; }
        .penalty-tag.red { color: #ef4444; }
        .penalty-date { font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; }

        .btn-approve { background: var(--primary); color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: opacity 0.2s; }
        .btn-approve:hover { opacity: 0.9; }
        .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }

        .empty-td { text-align: center; color: #94a3b8; padding: 40px !important; font-size: 0.875rem; font-weight: 500; }
      `}</style>
    </div>
  );
}
