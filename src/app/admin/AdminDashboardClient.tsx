'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  studentId: string;
  name: string;
  grade: number | null;
  createdAt: Date;
}

interface Application {
  id: string;
  status: string;
  representativeUser: {
    name: string;
    studentId: string;
  };
  slot: {
    date: Date;
    startTime: string;
    endTime: string;
    room: string;
  };
  skills: Array<{
    skill: {
      name: string;
    };
  }>;
  participants: Array<{
    name: string;
    studentId: string;
    attendanceStatus: string;
    cleanupBad: boolean;
  }>;
}

interface Skill {
  id: string;
  name: string;
  isActive: boolean;
  supplies: Array<{
    id: string;
    supplyName: string;
    quantity: number;
    unit: string;
    note: string | null;
  }>;
}

interface UsageLog {
  id: string;
  submittedAt: Date;
  application: {
    representativeUser: {
      name: string;
    };
    slot: {
      date: Date;
      room: string;
    };
  };
}

interface Props {
  initialPendingUsers: any[];
  initialPendingApps: any[];
  initialTodayApps: any[];
  initialSkills: any[];
  initialUsageLogs: any[];
}

export default function AdminDashboardClient({
  initialPendingUsers,
  initialPendingApps,
  initialTodayApps,
  initialSkills,
  initialUsageLogs
}: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [pendingUsers, setPendingUsers] = useState(initialPendingUsers);
  const [pendingApps, setPendingApps] = useState(initialPendingApps);
  const [todayApps, setTodayApps] = useState(initialTodayApps);
  const [skills, setSkills] = useState(initialSkills);
  const [usageLogs, setUsageLogs] = useState(initialUsageLogs);
  
  const router = useRouter();

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'APPROVED' : 'REJECTED' })
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        alert(action === 'approve' ? '승인되었습니다.' : '반려되었습니다.');
      }
    } catch (error) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleAppAction = async (appId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'APPROVED' : 'REJECTED' })
      });
      if (res.ok) {
        setPendingApps(prev => prev.filter(a => a.id !== appId));
        alert(action === 'approve' ? '승인되었습니다.' : '반려되었습니다.');
      }
    } catch (error) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="tab-menu">
        <button 
          className={activeTab === 'summary' ? 'active' : ''} 
          onClick={() => setActiveTab('summary')}
        >
          요약 현황
        </button>
        <button 
          className={activeTab === 'attendance' ? 'active' : ''} 
          onClick={() => setActiveTab('attendance')}
        >
          출석 및 정리 관리
        </button>
        <button 
          className={activeTab === 'skills' ? 'active' : ''} 
          onClick={() => setActiveTab('skills')}
        >
          술기 및 준비물
        </button>
        <button 
          className={activeTab === 'usage-logs' ? 'active' : ''} 
          onClick={() => setActiveTab('usage-logs')}
        >
          사용일지 현황
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div style={{ display: 'grid', gap: '32px' }}>
            {/* Pending Users */}
            <section className="dashboard-section">
              <div className="section-header">
                <h3>가입 신청 대기 ({pendingUsers.length})</h3>
                <Link href="/admin/users" className="text-link">전체보기</Link>
              </div>
              <div className="card-table">
                {pendingUsers.length === 0 ? (
                  <p className="empty-text">대기 중인 가입 신청이 없습니다.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>신청일</th>
                        <th>이름</th>
                        <th>학번</th>
                        <th>학년</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>{user.name}</td>
                          <td>{user.studentId}</td>
                          <td>{user.grade}학년</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleUserAction(user.id, 'approve')} className="btn-small btn-primary">승인</button>
                              <button onClick={() => handleUserAction(user.id, 'reject')} className="btn-small btn-outline">반려</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Pending Applications */}
            <section className="dashboard-section">
              <div className="section-header">
                <h3>OPEN LAB 신청 대기 ({pendingApps.length})</h3>
                <Link href="/admin/applications" className="text-link">전체보기</Link>
              </div>
              <div className="card-table">
                {pendingApps.length === 0 ? (
                  <p className="empty-text">대기 중인 OPEN LAB 신청이 없습니다.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>날짜/시간</th>
                        <th>실습실</th>
                        <th>신청자</th>
                        <th>술기</th>
                        <th>인원</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            {new Date(app.slot.date).toLocaleDateString()}<br/>
                            <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{app.slot.startTime} ~ {app.slot.endTime}</span>
                          </td>
                          <td>{app.slot.room}</td>
                          <td>{app.representativeUser.name} ({app.representativeUser.studentId})</td>
                          <td>{app.skills.map((s: any) => s.skill.name).join(', ')}</td>
                          <td>{app.participants.length}명</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Link href={`/admin/applications/${app.id}`} className="btn-small btn-outline">상세</Link>
                              <button onClick={() => handleAppAction(app.id, 'approve')} className="btn-small btn-primary">승인</button>
                              <button onClick={() => handleAppAction(app.id, 'reject')} className="btn-small btn-outline">반려</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="dashboard-section">
             <div className="section-header">
                <h3>오늘의 OPEN LAB 명단 ({todayApps.length})</h3>
                <Link href="/admin/attendance" className="btn-small btn-outline">출석 관리 전체보기</Link>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
                승인된 신청 내역입니다. 참여 학생별로 출석 및 정리 상태를 체크할 수 있습니다.
              </p>
              {/* This will be handled in detail in point 3 of the request, 
                  but for the dashboard we can show a summary or direct link. */}
              <div className="card-table">
                {todayApps.length === 0 ? (
                  <p className="empty-text">오늘 승인된 OPEN LAB이 없습니다.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>시간</th>
                        <th>실습실</th>
                        <th>대표자</th>
                        <th>술기</th>
                        <th>참여자</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayApps.map((app) => (
                        <tr key={app.id}>
                          <td>{app.slot.startTime} ~ {app.slot.endTime}</td>
                          <td>{app.slot.room}</td>
                          <td>{app.representativeUser.name}</td>
                          <td>{app.skills.map((s: any) => s.skill.name).join(', ')}</td>
                          <td>{app.participants.length}명</td>
                          <td>
                            <Link href={`/admin/attendance?date=${new Date().toISOString().split('T')[0]}&appId=${app.id}`} className="btn-small btn-primary">
                              출석체크
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <SkillManagement initialSkills={skills} />
        )}

        {activeTab === 'usage-logs' && (
           <div className="dashboard-section">
              <div className="section-header">
                <h3>최근 사용일지 제출 현황</h3>
                <Link href="/admin/usage-logs" className="text-link">전체보기</Link>
              </div>
              <div className="card-table">
                {usageLogs.length === 0 ? (
                  <p className="empty-text">제출된 사용일지가 없습니다.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>제출일시</th>
                        <th>사용일</th>
                        <th>신청자</th>
                        <th>실습실</th>
                        <th>상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.submittedAt).toLocaleString()}</td>
                          <td>{new Date(log.application.slot.date).toLocaleDateString()}</td>
                          <td>{log.application.representativeUser.name}</td>
                          <td>{log.application.slot.room}</td>
                          <td>
                            <Link href={`/admin/usage-logs/${log.id}`} className="text-link">보기</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
           </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .tab-menu {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 2px;
          overflow-x: auto;
        }
        .tab-menu button {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-weight: 600;
          color: var(--sub-text);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .tab-menu button:hover {
          color: var(--primary);
        }
        .tab-menu button.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .dashboard-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
        }
        .card-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9375rem;
        }
        th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid var(--muted-background);
          color: var(--sub-text);
          font-weight: 600;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid var(--muted-background);
        }
        .empty-text {
          text-align: center;
          padding: 40px;
          color: var(--sub-text);
          background: var(--muted-background);
          border-radius: 8px;
        }
        .btn-small {
          padding: 6px 12px;
          font-size: 0.8125rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          border: 1px solid transparent;
        }
        .btn-primary {
          background-color: var(--primary);
          color: white;
        }
        .btn-outline {
          border-color: var(--border);
          background: white;
          color: var(--text);
        }
        .text-link {
          color: var(--primary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

function SkillManagement({ initialSkills }: { initialSkills: any[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [selectedSkill, setSelectedSkill] = useState<any>(initialSkills[0] || null);

  return (
    <div className="skill-mgmt-container">
      <div className="skill-list-pane">
        <div className="section-header">
          <h3>술기 목록</h3>
          <button className="btn-small btn-primary">새 술기 추가</button>
        </div>
        <div className="skill-items">
          {skills.map(skill => (
            <div 
              key={skill.id} 
              className={`skill-item ${selectedSkill?.id === skill.id ? 'active' : ''}`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className="skill-info">
                <span className="skill-name">{skill.name}</span>
                <span className={`status-badge ${skill.isActive ? 'active' : 'inactive'}`}>
                  {skill.isActive ? '활성' : '비활성'}
                </span>
              </div>
              <div className="skill-actions">
                <button className="icon-btn">✏️</button>
              </div>
            </div>
          ))}
          <div className="skill-item other">
             <span className="skill-name">기타 (시스템 기본)</span>
          </div>
        </div>
      </div>
      
      <div className="supply-list-pane">
        {selectedSkill ? (
          <>
            <div className="section-header">
              <h3>[{selectedSkill.name}] 준비물 관리</h3>
              <button className="btn-small btn-primary">준비물 추가</button>
            </div>
            <div className="card-table">
              <table>
                <thead>
                  <tr>
                    <th>품목명</th>
                    <th>수량</th>
                    <th>단위</th>
                    <th>비고</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSkill.supplies.map((supply: any) => (
                    <tr key={supply.id}>
                      <td>{supply.supplyName}</td>
                      <td>{supply.quantity}</td>
                      <td>{supply.unit}</td>
                      <td>{supply.note || '-'}</td>
                      <td>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="icon-btn">✏️</button>
                            <button className="icon-btn">🗑️</button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {selectedSkill.supplies.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--sub-text)' }}>
                        등록된 준비물이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state">
            술기를 선택하면 준비물 목록이 표시됩니다.
          </div>
        )}
      </div>

      <style jsx>{`
        .skill-mgmt-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border);
          overflow: hidden;
          min-height: 500px;
        }
        .skill-list-pane {
          border-right: 1px solid var(--border);
          padding: 20px;
          background: #fcfcfc;
        }
        .supply-list-pane {
          padding: 20px;
        }
        .skill-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }
        .skill-item {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          transition: all 0.2s;
        }
        .skill-item:hover {
          border-color: var(--primary);
          background: #f0f7ff;
        }
        .skill-item.active {
          border-color: var(--primary);
          background: #e6f0ff;
        }
        .skill-item.other {
          background: #f5f5f5;
          cursor: default;
        }
        .skill-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .skill-name {
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .status-badge {
          font-size: 0.6875rem;
          padding: 1px 6px;
          border-radius: 4px;
          width: fit-content;
        }
        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }
        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .icon-btn:hover {
          background: var(--muted-background);
        }
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--sub-text);
        }
      `}</style>
    </div>
  );
}
