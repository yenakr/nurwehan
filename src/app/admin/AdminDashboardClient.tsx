'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplicationListClient from './applications/ApplicationListClient';

interface Props {
  initialUsers: any[];
  initialParticipants: any[];
  initialSkills: any[];
  initialApplications: any[];
  selectedDate: string;
}

export default function AdminDashboardClient({
  initialUsers,
  initialParticipants,
  initialSkills,
  initialApplications,
  selectedDate
}: Props) {
  const [activeTab, setActiveTab] = useState('schedules');
  const [skills, setSkills] = useState(initialSkills);
  
  const router = useRouter();

  return (
    <div className="dashboard-container">
      <div className="tab-menu">
        <button 
          className={activeTab === 'schedules' ? 'active' : ''} 
          onClick={() => setActiveTab('schedules')}
        >
          OPEN LAB 시간표
        </button>
        <button 
          className={activeTab === 'skills' ? 'active' : ''} 
          onClick={() => setActiveTab('skills')}
        >
          술기 및 준비물
        </button>
        <button onClick={() => router.push('/admin/roadmap')}>
          🧭 MY ROADMAP 관리
        </button>
        <button onClick={() => router.push('/admin/calendar')}>
          📅 통합 CALENDAR 관리
        </button>
        <button onClick={() => router.push('/admin/clinical')}>
          🩺 건강요건 Rule 관리
        </button>
      </div>

      <div className="tab-content">

        {activeTab === 'schedules' && (
          <div className="dashboard-section">
            <ScheduleManagement />
          </div>
        )}

        {activeTab === 'skills' && (
          <SkillManagement initialSkills={skills} />
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
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-weight: 700;
          color: var(--sub-text);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          font-size: 1rem;
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
          padding: 32px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .dashboard-section.no-padding {
          padding: 0;
          background: transparent;
          border: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}

function ScheduleManagement() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form states for new rule
  const [grade, setGrade] = useState('2');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Monday
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [room, setRoom] = useState('임상수기실습실 (5층)');
  const [maxCapacity, setMaxCapacity] = useState('10');

  // Form states for edit rule
  const [editForm, setEditForm] = useState({
    grade: '2',
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '12:00',
    room: '임상수기실습실 (5층)',
    maxCapacity: '10'
  });

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rules');
      const data = await res.json();
      if (Array.isArray(data)) setRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseInt(grade),
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          room,
          maxCapacity: parseInt(maxCapacity)
        })
      });
      if (res.ok) {
        setIsAdding(false);
        fetchRules();
      } else {
        const err = await res.json();
        alert(err.message || '저장 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleStartEdit = (rule: any) => {
    setEditingRuleId(rule.id);
    setEditForm({
      grade: rule.grade.toString(),
      dayOfWeek: rule.dayOfWeek.toString(),
      startTime: rule.startTime,
      endTime: rule.endTime,
      room: rule.room,
      maxCapacity: rule.maxCapacity.toString()
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseInt(editForm.grade),
          dayOfWeek: parseInt(editForm.dayOfWeek),
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          room: editForm.room,
          maxCapacity: parseInt(editForm.maxCapacity)
        })
      });
      if (res.ok) {
        setEditingRuleId(null);
        fetchRules();
      } else {
        const err = await res.json();
        alert(err.message || '수정 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 운영시간 설정을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/rules/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchRules();
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchRules();
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="rules-mgmt-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>실습실 학년별 운영시간(시간표) 설정</h3>
        <button className="btn-small btn-primary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? '닫기' : '+ 새 운영시간 추가'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="add-rule-form">
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9375rem', fontWeight: '800' }}>새 운영시간 추가</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>대상 학년</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
                <option value="4">4학년</option>
              </select>
            </div>
            <div className="form-group">
              <label>요일</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                <option value="1">월요일</option>
                <option value="2">화요일</option>
                <option value="3">수요일</option>
                <option value="4">목요일</option>
                <option value="5">금요일</option>
                <option value="6">토요일</option>
                <option value="0">일요일</option>
              </select>
            </div>
            <div className="form-group">
              <label>시작 시각</label>
              <input type="text" placeholder="HH:mm (예: 09:00)" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>종료 시각</label>
              <input type="text" placeholder="HH:mm (예: 12:00)" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>실습실</label>
              <select value={room} onChange={e => setRoom(e.target.value)}>
                <option value="임상수기실습실 (5층)">임상수기실습실 (5층)</option>
                <option value="시뮬레이션실습실 (6층)">시뮬레이션실습실 (6층)</option>
              </select>
            </div>
            <div className="form-group">
              <label>최대 수용인원(명)</label>
              <input type="number" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn-small btn-primary">저장하기</button>
            <button type="button" className="btn-small btn-outline" onClick={() => setIsAdding(false)}>취소</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--sub-text)' }}>운영 정보를 불러오는 중...</div>
      ) : rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--sub-text)', border: '2px dashed var(--border)', borderRadius: '12px' }}>등록된 운영시간 정보가 없습니다.</div>
      ) : (
        <div className="card-table">
          <table>
            <thead>
              <tr>
                <th>학년</th>
                <th>요일</th>
                <th>시간</th>
                <th>실습실</th>
                <th>정원</th>
                <th>활성화</th>
                <th style={{ textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => {
                const isEditing = editingRuleId === rule.id;
                return (
                  <tr key={rule.id}>
                    {isEditing ? (
                      <>
                        <td>
                          <select value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })}>
                            <option value="2">2학년</option>
                            <option value="3">3학년</option>
                            <option value="4">4학년</option>
                          </select>
                        </td>
                        <td>
                          <select value={editForm.dayOfWeek} onChange={e => setEditForm({ ...editForm, dayOfWeek: e.target.value })}>
                            <option value="1">월요일</option>
                            <option value="2">화요일</option>
                            <option value="3">수요일</option>
                            <option value="4">목요일</option>
                            <option value="5">금요일</option>
                            <option value="6">토요일</option>
                            <option value="0">일요일</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input style={{ width: '70px', padding: '6px' }} value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} />
                            <span>~</span>
                            <input style={{ width: '70px', padding: '6px' }} value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} />
                          </div>
                        </td>
                        <td>
                          <select value={editForm.room} onChange={e => setEditForm({ ...editForm, room: e.target.value })}>
                            <option value="임상수기실습실 (5층)">임상수기실습실 (5층)</option>
                            <option value="시뮬레이션실습실 (6층)">시뮬레이션실습실 (6층)</option>
                          </select>
                        </td>
                        <td>
                          <input type="number" style={{ width: '60px', padding: '6px' }} value={editForm.maxCapacity} onChange={e => setEditForm({ ...editForm, maxCapacity: e.target.value })} />
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: rule.isActive ? '#166534' : '#991b1b', fontWeight: '800' }}>
                            {rule.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleSaveEdit(rule.id)} className="btn-small btn-primary" style={{ padding: '6px 12px' }}>저장</button>
                            <button onClick={() => setEditingRuleId(null)} className="btn-small btn-outline" style={{ padding: '6px 12px' }}>취소</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: '800' }}>{rule.grade}학년</td>
                        <td>{dayNames[rule.dayOfWeek]}요일</td>
                        <td>{rule.startTime} ~ {rule.endTime}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{rule.room}</td>
                        <td>{rule.maxCapacity}명</td>
                        <td>
                          <button 
                            className={`status-toggle-btn ${rule.isActive ? 'active' : 'inactive'}`}
                            onClick={() => toggleActive(rule.id, rule.isActive)}
                          >
                            {rule.isActive ? '활성' : '비활성'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleStartEdit(rule)} className="btn-small btn-outline">수정</button>
                            <button onClick={() => handleDelete(rule.id)} className="btn-small btn-danger-outline">삭제</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .rules-mgmt-container {
          display: flex;
          flex-direction: column;
        }
        .add-rule-form {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--sub-text);
        }
        .form-group input, .form-group select {
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .card-table {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        th {
          background-color: #f8fafc;
          padding: 14px 16px;
          font-size: 0.8125rem;
          color: var(--sub-text);
          font-weight: 800;
          border-bottom: 2px solid var(--border);
        }
        td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .status-toggle-btn {
          border: none;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
        }
        .status-toggle-btn.active {
          background: #dcfce7;
          color: #166534;
        }
        .status-toggle-btn.inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        .btn-danger-outline {
          background: white;
          color: #ef4444;
          border: 1px solid #fee2e2;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .btn-danger-outline:hover {
          background: #fee2e2;
        }
        input, select {
          border: 1px solid var(--border);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

function SkillManagement({ initialSkills }: { initialSkills: any[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [selectedSkill, setSelectedSkill] = useState<any>(initialSkills[0] || null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillName, setEditingSkillName] = useState('');

  const refreshSkills = async () => {
    const res = await fetch('/api/admin/skills');
    const data = await res.json();
    setSkills(data);
    if (selectedSkill) {
      const updated = data.find((s: any) => s.id === selectedSkill.id);
      setSelectedSkill(updated || data[0] || null);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    const res = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSkillName.trim() })
    });
    if (res.ok) {
      setNewSkillName('');
      setIsAddingSkill(false);
      refreshSkills();
    }
  };

  const handleSaveSkillName = async (skillId: string) => {
    if (!editingSkillName.trim()) return;
    const res = await fetch(`/api/admin/skills/${skillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingSkillName.trim() })
    });
    if (res.ok) {
      setEditingSkillId(null);
      refreshSkills();
    } else {
      const err = await res.json();
      alert(err.message || '저장 중 오류가 발생했습니다.');
    }
  };

  const toggleSkillStatus = async (skillId: string, currentStatus: boolean) => {
    await fetch(`/api/admin/skills/${skillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    refreshSkills();
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 관련 준비물도 모두 삭제됩니다.')) return;
    const res = await fetch(`/api/admin/skills/${skillId}`, { method: 'DELETE' });
    if (res.ok) refreshSkills();
  };

  return (
    <div className="skill-mgmt-container">
      <div className="skill-list-pane">
        <div className="section-header">
          <h3>술기 목록</h3>
          <button className="btn-small btn-primary" onClick={() => setIsAddingSkill(true)}>+ 추가</button>
        </div>

        {isAddingSkill && (
          <div className="inline-form">
            <input 
              value={newSkillName} 
              onChange={e => setNewSkillName(e.target.value)}
              placeholder="새 술기 이름"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              <button onClick={handleAddSkill} className="btn-small btn-primary">저장</button>
              <button onClick={() => setIsAddingSkill(false)} className="btn-small btn-outline">취소</button>
            </div>
          </div>
        )}

        <div className="skill-items">
          {skills.map(skill => {
            const isEditing = editingSkillId === skill.id;
            const isSelected = selectedSkill?.id === skill.id;
            return (
              <div 
                key={skill.id} 
                className={`skill-item ${isSelected ? 'active' : ''} ${!skill.isActive ? 'inactive-skill' : ''}`}
                onClick={() => setSelectedSkill(skill)}
              >
                {isEditing ? (
                  <div className="skill-edit-form" onClick={(e) => e.stopPropagation()} style={{ width: '100%' }}>
                    <input 
                      type="text" 
                      value={editingSkillName} 
                      onChange={e => setEditingSkillName(e.target.value)}
                      className="skill-name-input"
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--primary)',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleSaveSkillName(skill.id)} className="btn-small btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>저장</button>
                      <button onClick={() => setEditingSkillId(null)} className="btn-small btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="skill-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="skill-name">{skill.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSkillId(skill.id);
                            setEditingSkillName(skill.name);
                          }}
                          className="skill-edit-btn"
                          title="이름 수정"
                        >
                          ✏️
                        </button>
                      </div>
                      <button 
                        className={`status-badge ${skill.isActive ? 'active' : 'inactive'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSkillStatus(skill.id, skill.isActive);
                        }}
                        style={{ cursor: 'pointer', border: 'none', textAlign: 'center' }}
                      >
                        {skill.isActive ? '활성' : '비활성'}
                      </button>
                    </div>
                    <div className="skill-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDeleteSkill(skill.id)} className="icon-btn" title="삭제">🗑️</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="supply-list-pane">
        {selectedSkill ? (
          <SupplyList skill={selectedSkill} onUpdate={refreshSkills} />
        ) : (
          <div className="empty-state">
            술기를 선택하면 준비물 목록이 표시됩니다.
          </div>
        )}
      </div>

      <style jsx>{`
        .skill-mgmt-container {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 0;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow: hidden;
          min-height: 600px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .skill-list-pane {
          border-right: 1px solid var(--border);
          padding: 24px;
          background: #f8fafc;
        }
        .supply-list-pane {
          padding: 32px;
        }
        .inline-form {
          margin-bottom: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--primary);
        }
        .inline-form input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .skill-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }
        .skill-item {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          transition: all 0.2s;
        }
        .skill-item:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        .skill-item.active {
          border-color: var(--primary);
          background: #f0f7ff;
          box-shadow: 0 2px 4px rgba(14, 74, 132, 0.1);
        }
        .skill-item.inactive-skill {
          opacity: 0.6;
          background: #f1f5f9;
        }
        .skill-item.inactive-skill:hover {
          opacity: 0.85;
        }
        .skill-item.active.inactive-skill {
          border-color: var(--primary);
          background: #f0f7ff;
          opacity: 0.85;
        }
        .skill-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .skill-name {
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--text);
        }
        .skill-edit-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 2px 4px;
          border-radius: 4px;
          opacity: 0.4;
          transition: all 0.2s;
        }
        .skill-edit-btn:hover {
          opacity: 1;
          background: #e2e8f0;
        }
        .status-badge {
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 2px 8px;
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
          padding: 8px;
          border-radius: 8px;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: #f1f5f9;
        }
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--sub-text);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

const DEFAULT_UNITS = ['개', '세트', 'mL', 'L', '장', '쌍', '통', '병', '롤', '팩'];

function SupplyList({ skill, onUpdate }: { skill: any, onUpdate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSupply, setNewSupply] = useState({
    supplyName: '',
    quantity: 1,
    unit: '개',
    note: '-'
  });
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [editingSupplyData, setEditingSupplyData] = useState({
    supplyName: '',
    quantity: 1,
    unit: '개',
    note: ''
  });

  const handleAdd = async () => {
    if (!newSupply.supplyName.trim()) {
      alert('품목명을 입력해주세요.');
      return;
    }
    if (newSupply.quantity <= 0) {
      alert('수량은 0보다 커야 합니다.');
      return;
    }
    const res = await fetch(`/api/admin/skills/${skill.id}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newSupply,
        supplyName: newSupply.supplyName.trim(),
        note: newSupply.note.trim() || '-'
      })
    });
    if (res.ok) {
      setNewSupply({ supplyName: '', quantity: 1, unit: '개', note: '-' });
      setIsAdding(false);
      onUpdate();
    } else {
      alert('추가 실패');
    }
  };

  const handleStartEditSupply = (supply: any) => {
    setEditingSupplyId(supply.id);
    setEditingSupplyData({
      supplyName: supply.supplyName,
      quantity: supply.quantity,
      unit: supply.unit,
      note: supply.note || '-'
    });
  };

  const handleSaveSupply = async (id: string) => {
    if (!editingSupplyData.supplyName.trim()) {
      alert('품목명을 입력해주세요.');
      return;
    }
    if (editingSupplyData.quantity <= 0) {
      alert('수량은 0보다 커야 합니다.');
      return;
    }
    const res = await fetch(`/api/admin/supplies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplyName: editingSupplyData.supplyName.trim(),
        quantity: editingSupplyData.quantity,
        unit: editingSupplyData.unit.trim(),
        note: editingSupplyData.note.trim() || '-'
      })
    });
    if (res.ok) {
      setEditingSupplyId(null);
      onUpdate();
    } else {
      alert('저장 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/supplies/${id}`, { method: 'DELETE' });
    if (res.ok) onUpdate();
  };

  return (
    <div className="supply-list-content">
      <div className="section-header">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
          <span style={{ color: 'var(--primary)' }}>[{skill.name}]</span> 준비물 관리
        </h3>
        <button className="btn-small btn-primary" onClick={() => setIsAdding(true)}>+ 준비물 추가</button>
      </div>

      {isAdding && (
        <div className="supply-form-card">
          <div className="form-grid">
            <div className="form-item">
              <label>품목명 *</label>
              <input 
                value={newSupply.supplyName} 
                onChange={e => setNewSupply({...newSupply, supplyName: e.target.value})} 
                placeholder="예: 알코올 솜"
              />
            </div>
            <div className="form-item">
              <label>수량 *</label>
              <input 
                type="number" 
                value={newSupply.quantity} 
                onChange={e => setNewSupply({...newSupply, quantity: parseInt(e.target.value) || 0})} 
                min="1"
              />
            </div>
            <div className="form-item">
              <label>단위 *</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select 
                  value={DEFAULT_UNITS.includes(newSupply.unit) ? newSupply.unit : 'custom'} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setNewSupply({...newSupply, unit: ''});
                    } else {
                      setNewSupply({...newSupply, unit: val});
                    }
                  }}
                  style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'white' }}
                >
                  {DEFAULT_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="custom">직접 입력</option>
                </select>
                {!DEFAULT_UNITS.includes(newSupply.unit) && (
                  <input 
                    type="text" 
                    placeholder="단위 입력"
                    value={newSupply.unit} 
                    onChange={e => setNewSupply({...newSupply, unit: e.target.value})} 
                    style={{ width: '100px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                )}
              </div>
            </div>
            <div className="form-item wide">
              <label>비고</label>
              <input value={newSupply.note} onChange={e => setNewSupply({...newSupply, note: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button onClick={handleAdd} className="btn-small btn-primary">저장</button>
            <button onClick={() => {
              setIsAdding(false);
              setNewSupply({ supplyName: '', quantity: 1, unit: '개', note: '-' });
            }} className="btn-small btn-outline">취소</button>
          </div>
        </div>
      )}

      <div className="card-table">
        <table>
          <thead>
            <tr>
              <th>품목명</th>
              <th>수량</th>
              <th>단위</th>
              <th>비고</th>
              <th style={{ textAlign: 'right' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {skill.supplies.map((supply: any) => {
              const isEditing = editingSupplyId === supply.id;
              if (isEditing) {
                return (
                  <tr key={supply.id}>
                    <td>
                      <input 
                        type="text" 
                        value={editingSupplyData.supplyName} 
                        onChange={e => setEditingSupplyData({...editingSupplyData, supplyName: e.target.value})} 
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--primary)', borderRadius: '6px' }}
                        placeholder="품목명 입력"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={editingSupplyData.quantity} 
                        onChange={e => setEditingSupplyData({...editingSupplyData, quantity: parseInt(e.target.value) || 0})} 
                        style={{ width: '80px', padding: '6px 10px', border: '1px solid var(--primary)', borderRadius: '6px' }}
                        min="1"
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select 
                          value={DEFAULT_UNITS.includes(editingSupplyData.unit) ? editingSupplyData.unit : 'custom'} 
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              setEditingSupplyData({...editingSupplyData, unit: ''});
                            } else {
                              setEditingSupplyData({...editingSupplyData, unit: val});
                            }
                          }}
                          style={{ padding: '6px 10px', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.875rem', background: 'white' }}
                        >
                          {DEFAULT_UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                          <option value="custom">직접 입력</option>
                        </select>
                        {!DEFAULT_UNITS.includes(editingSupplyData.unit) && (
                          <input 
                            type="text" 
                            placeholder="단위"
                            value={editingSupplyData.unit} 
                            onChange={e => setEditingSupplyData({...editingSupplyData, unit: e.target.value})} 
                            style={{ width: '80px', padding: '6px 10px', border: '1px solid var(--primary)', borderRadius: '6px' }}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={editingSupplyData.note} 
                        onChange={e => setEditingSupplyData({...editingSupplyData, note: e.target.value})} 
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--primary)', borderRadius: '6px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleSaveSupply(supply.id)} className="btn-small btn-primary" style={{ padding: '6px 12px' }}>저장</button>
                        <button onClick={() => setEditingSupplyId(null)} className="btn-small btn-outline" style={{ padding: '6px 12px' }}>취소</button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={supply.id}>
                  <td style={{ fontWeight: '600' }}>{supply.supplyName}</td>
                  <td>{supply.quantity}</td>
                  <td>{supply.unit}</td>
                  <td style={{ color: 'var(--sub-text)', fontSize: '0.8125rem' }}>{supply.note || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleStartEditSupply(supply)} 
                        className="icon-btn" 
                        title="수정"
                        style={{ fontSize: '1rem' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(supply.id)} 
                        className="icon-btn" 
                        title="삭제"
                        style={{ fontSize: '1rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {skill.supplies.length === 0 && !isAdding && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--sub-text)' }}>
                  등록된 준비물이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .supply-form-card {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr;
          gap: 16px;
        }
        .form-item.wide {
          grid-column: span 3;
        }
        .form-item label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--sub-text);
          margin-bottom: 6px;
        }
        .form-item input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        th { font-size: 0.8125rem; color: var(--sub-text); padding: 12px; }
        td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
      `}</style>
    </div>
  );
}
