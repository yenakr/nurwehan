'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplicationListClient from './applications/ApplicationListClient';

interface Props {
  initialUsers: any[];
  initialParticipants: any[];
  initialSkills: any[];
  initialApplications: any[];
  pendingUsersCount?: number;
  assignmentNeedsUpdate?: boolean;
  selectedDate: string;
}

export default function AdminDashboardClient({
  initialUsers,
  initialParticipants,
  initialSkills,
  initialApplications,
  pendingUsersCount = 0,
  assignmentNeedsUpdate = false,
  selectedDate
}: Props) {
  const [activeTab, setActiveTab] = useState('schedules');
  const [skills, setSkills] = useState(initialSkills);
  
  const router = useRouter();

  const groups: { title: string; items: { icon: string; label: string; desc: string; href: string; badge?: number }[] }[] = [
    {
      title: '학생 · 학습',
      items: [
        { icon: '👥', label: '학생 관리', desc: '가입 승인, 정보 수정', href: '/admin/users', badge: pendingUsersCount },
        { icon: '📊', label: '퀴즈 학습 현황', desc: '학생별 학습·정답률', href: '/admin/quiz-stats' },
        { icon: '🧠', label: '퀴즈 콘텐츠', desc: '과목·용어 추가·수정', href: '/quiz' },
      ],
    },
    {
      title: '콘텐츠',
      items: [
        { icon: '📅', label: '캘린더', desc: '공식 일정 관리', href: '/admin/calendar' },
        { icon: '📢', label: '공지사항', desc: '공지 작성·고정', href: '/admin/notices' },
        { icon: '🏥', label: '실습 배정표', desc: '학기별 배정 올리기', href: '/admin/clinical-assignments', badge: assignmentNeedsUpdate ? 1 : 0 },
        { icon: '🩺', label: '건강요건 규칙', desc: '임상실습 요건 설정', href: '/admin/clinical' },
      ],
    },
  ];

  return (
    <div className="dashboard-container">
      {(pendingUsersCount > 0 || assignmentNeedsUpdate) && (
        <div className="todo">
          {pendingUsersCount > 0 && (
            <button onClick={() => router.push('/admin/users?tab=pending')} className="todoItem">
              <strong>가입 승인 대기 {pendingUsersCount}명</strong>
              <span>확인하기 →</span>
            </button>
          )}
          {assignmentNeedsUpdate && (
            <button onClick={() => router.push('/admin/clinical-assignments')} className="todoItem">
              <strong>임상실습 배정표를 새 학기로 업데이트해 주세요</strong>
              <span>올리기 →</span>
            </button>
          )}
        </div>
      )}

      {groups.map(g => (
        <section key={g.title}>
          <h2 className="groupTitle">{g.title}</h2>
          <div className="grid">
            {g.items.map(it => (
              <button key={it.href} onClick={() => router.push(it.href)} className="tile">
                <span className="tileText">
                  <span className="tileLabel">
                    {it.label}
                    {!!it.badge && <span className="badge">{it.badge}</span>}
                  </span>
                  <span className="tileDesc">{it.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="groupTitle">OPEN LAB 설정</h2>
        <div className="seg">
          <button className={activeTab === 'schedules' ? 'on' : ''} onClick={() => setActiveTab('schedules')}>
            시간표
          </button>
          <button className={activeTab === 'skills' ? 'on' : ''} onClick={() => setActiveTab('skills')}>
            술기·준비물
          </button>
        </div>
        <div style={{ marginTop: '16px' }}>
          {activeTab === 'schedules' && (
            <div className="dashboard-section">
              <ScheduleManagement />
            </div>
          )}
          {activeTab === 'skills' && <SkillManagement initialSkills={skills} />}
        </div>
      </section>

      <style jsx>{`
        .dashboard-container { display: flex; flex-direction: column; gap: 28px; }
        .todo { display: flex; flex-direction: column; gap: 8px; }
        .todoItem {
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 10px; border: 1px solid #FECACA;
          background: #FEF2F2; color: #991B1B; cursor: pointer; font-size: 0.9375rem; text-align: left;
        }
        .todoItem span { font-weight: 700; white-space: nowrap; }
        .groupTitle { font-size: 0.8125rem; font-weight: 800; color: var(--sub-text); margin-bottom: 10px; letter-spacing: 0.02em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
        .tile {
          display: flex; align-items: center; gap: 12px; padding: 16px; text-align: left;
          background: #fff; border: 1px solid var(--border); border-radius: 12px; cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tile:hover { border-color: var(--primary); box-shadow: 0 2px 8px rgba(14, 74, 132, 0.1); }
        .tileIcon { font-size: 1.5rem; }
        .tileText { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .tileLabel { font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 6px; }
        .tileDesc { font-size: 0.8125rem; color: var(--sub-text); }
        .badge { background: #EF4444; color: #fff; border-radius: 999px; padding: 1px 8px; font-size: 0.75rem; font-weight: 800; }
        .seg { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .seg button { padding: 8px 18px; border: none; background: #fff; cursor: pointer; font-weight: 600; color: var(--text); }
        .seg button.on { background: var(--primary); color: #fff; font-weight: 800; }
        .dashboard-section {
          background: white; padding: 24px; border-radius: 16px; border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}

function ScheduleManagement() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: 0 }}>운영 시간표</h3>
        <button className="btn-small btn-primary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? '닫기' : '+ 추가'}
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
        (() => {
          const gradeCls = (g: number) => `g${g}`;
          const days = [1, 2, 3, 4, 5, 6, 0].filter(d => d >= 1 && d <= 5 || rules.some(r => r.dayOfWeek === d));
          const slots = Array.from(new Set(rules.map(r => `${r.startTime}~${r.endTime}`))).sort();
          const selected = rules.find(r => r.id === selectedRuleId) || null;
          return (
            <>
              <div className="legend">
                {Array.from(new Set(rules.map(r => r.grade as number))).sort((x, y) => x - y).map(g => (
                  <span key={g} className={`lg ${gradeCls(g)}`}><i />{g}학년</span>
                ))}
              </div>
              <div className="gridwrap">
                <table className="tt">
                  <thead>
                    <tr>
                      <th></th>
                      {days.map(d => <th key={d}>{dayNames[d]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map(sl => (
                      <tr key={sl}>
                        <th className="tcol">{sl.replace('~', '\n')}</th>
                        {days.map(d => {
                          const cell = rules.filter(r => r.dayOfWeek === d && `${r.startTime}~${r.endTime}` === sl);
                          return (
                            <td key={d}>
                              {cell.map(r => (
                                <button
                                  key={r.id}
                                  type="button"
                                  className={`chip ${gradeCls(r.grade)} ${r.isActive ? '' : 'off'} ${selectedRuleId === r.id ? 'sel' : ''}`}
                                  onClick={() => { setSelectedRuleId(selectedRuleId === r.id ? null : r.id); setEditingRuleId(null); }}
                                >
                                  {r.grade}학년
                                </button>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selected && editingRuleId !== selected.id && (
                <div className="sel-bar">
                  <span><b>{selected.grade}학년</b> {dayNames[selected.dayOfWeek]} {selected.startTime}~{selected.endTime}</span>
                  <div className="rbtns">
                    <button
                      className={`status-toggle-btn ${selected.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleActive(selected.id, selected.isActive)}
                    >
                      {selected.isActive ? '사용' : '중지'}
                    </button>
                    <button onClick={() => handleStartEdit(selected)} className="btn-small btn-outline">수정</button>
                    <button onClick={() => { handleDelete(selected.id); setSelectedRuleId(null); }} className="btn-small btn-danger-outline">삭제</button>
                  </div>
                </div>
              )}

              {selected && editingRuleId === selected.id && (
                <div className="redit">
                  <div className="form-grid">
                    <select value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })}>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                      <option value="4">4학년</option>
                    </select>
                    <select value={editForm.dayOfWeek} onChange={e => setEditForm({ ...editForm, dayOfWeek: e.target.value })}>
                      {[1, 2, 3, 4, 5, 6, 0].map(d => (
                        <option key={d} value={d}>{dayNames[d]}요일</option>
                      ))}
                    </select>
                    <input value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} placeholder="시작 09:00" />
                    <input value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} placeholder="종료 10:00" />
                    <select value={editForm.room} onChange={e => setEditForm({ ...editForm, room: e.target.value })}>
                      <option value="임상수기실습실 (5층)">임상수기실습실 (5층)</option>
                      <option value="시뮬레이션실습실 (6층)">시뮬레이션실습실 (6층)</option>
                    </select>
                    <input type="number" value={editForm.maxCapacity} onChange={e => setEditForm({ ...editForm, maxCapacity: e.target.value })} placeholder="정원" />
                  </div>
                  <div className="rbtns" style={{ marginTop: '10px' }}>
                    <button onClick={() => handleSaveEdit(selected.id)} className="btn-small btn-primary">저장</button>
                    <button onClick={() => setEditingRuleId(null)} className="btn-small btn-outline">취소</button>
                  </div>
                </div>
              )}
            </>
          );
        })()
      )}

      <style jsx>{`
        .legend { display: flex; gap: 12px; margin-bottom: 8px; }
        .lg { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: var(--sub-text); }
        .lg i { width: 8px; height: 8px; border-radius: 50%; background: currentColor; display: inline-block; }
        .lg.g2 { color: #4f6bd8; } .lg.g3 { color: #2f9a82; } .lg.g4 { color: #c98a2b; }
        .gridwrap { overflow-x: auto; }
        .tt { width: 100%; min-width: 440px; border-collapse: separate; border-spacing: 4px; table-layout: fixed; }
        .tt th { font-size: 0.75rem; font-weight: 600; color: var(--sub-text); padding: 2px 0 4px; background: none; text-align: center; }
        .tt th.tcol { width: 44px; font-size: 0.6875rem; font-weight: 500; white-space: pre-line; line-height: 1.25; text-align: right; padding-right: 6px; font-variant-numeric: tabular-nums; vertical-align: middle; }
        .tt td { padding: 0; vertical-align: top; height: 38px; background: #f8fafc; border-radius: 8px; }
        .tt td:has(.chip) { background: none; }
        .chip { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 38px; padding: 0 6px; margin: 0 0 3px; border-radius: 8px; border: 1.5px solid transparent; font-size: 0.8125rem; font-weight: 700; cursor: pointer; font-family: inherit; }
        .chip:last-child { margin-bottom: 0; }
        .chip.g1 { background: #fdf0d5; color: #8a5a14; }
        .chip.g2 { background: #e6ecfb; color: #2b45a8; }
        .chip.g3 { background: #def2ec; color: #1d6b5a; }
        .chip.g4 { background: #f8ecd8; color: #9a6410; }
        .chip.off { opacity: 0.4; border-style: dashed; border-color: currentColor; }
        .chip.sel { border-color: var(--primary); }
        .sel-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eef2f7; font-size: 0.875rem; }
        .groups { display: flex; flex-direction: column; gap: 18px; }
        .gtitle { font-size: 0.9375rem; font-weight: 800; margin: 0 0 8px; }
        .rlist { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .rrow { display: flex; align-items: center; gap: 10px 14px; padding: 10px 12px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
        .rrow:first-child { border-top: none; }
        .rrow.off { opacity: 0.5; }
        .rtime { display: flex; gap: 8px; align-items: baseline; flex: 0 0 auto; white-space: nowrap; }
        .rtime b { width: 1.2em; }
        .rtime span { font-variant-numeric: tabular-nums; }
        .rmeta { color: var(--sub-text); font-size: 0.8125rem; flex: 1 1 auto; white-space: nowrap; }
        .rbtns { display: flex; gap: 6px; margin-left: auto; }
        .redit { padding: 12px; border-top: 1px solid #f1f5f9; background: #f8fafc; }
        .rules-mgmt-container {
          display: flex;
          flex-direction: column;
        }
        .add-rule-form {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 16px;
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
                    <span className="skill-name">{skill.name}</span>
                    <div className="skill-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`status-badge ${skill.isActive ? 'active' : 'inactive'}`}
                        onClick={() => toggleSkillStatus(skill.id, skill.isActive)}
                        title="눌러서 활성/비활성 전환"
                      >
                        {skill.isActive ? '활성' : '비활성'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSkillId(skill.id);
                          setEditingSkillName(skill.name);
                        }}
                        className="txt-btn"
                      >
                        수정
                      </button>
                      <button onClick={() => handleDeleteSkill(skill.id)} className="txt-btn danger">삭제</button>
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
        .section-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .section-header h3 { font-size: 1rem; font-weight: 800; margin: 0; }
        .skill-mgmt-container {
          display: grid;
          grid-template-columns: 340px 1fr;
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .skill-list-pane {
          border-right: 1px solid var(--border);
          padding: 16px;
          background: #f8fafc;
        }
        .supply-list-pane { padding: 20px 24px; min-width: 0; }
        .inline-form {
          margin: 12px 0;
          padding: 12px;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--primary);
        }
        .inline-form input { width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; }
        .skill-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .skill-item {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          background: white;
        }
        .skill-item:hover { border-color: var(--primary); }
        .skill-item.active { border-color: var(--primary); background: #f0f7ff; box-shadow: inset 0 0 0 1px var(--primary); }
        .skill-item.inactive-skill .skill-name { color: var(--sub-text); }
        .skill-name { font-weight: 700; font-size: 0.875rem; color: var(--text); min-width: 0; flex: 1; }
        .skill-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
        .status-badge {
          font-size: 0.6875rem; font-weight: 800; padding: 3px 8px; border-radius: 999px;
          border: none; cursor: pointer; margin-right: 4px;
        }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.inactive { background: #e2e8f0; color: #64748b; }
        .txt-btn {
          background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 6px;
          font-size: 0.75rem; font-weight: 700; color: var(--sub-text);
        }
        .txt-btn:hover { background: #f1f5f9; color: var(--text); }
        .txt-btn.danger:hover { background: #fee2e2; color: #b91c1c; }
        @media (max-width: 760px) {
          .skill-mgmt-container { grid-template-columns: 1fr; }
          .skill-list-pane { border-right: none; border-bottom: 1px solid var(--border); }
          .skill-items { max-height: 40vh; }
          .supply-list-pane { padding: 16px; }
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

const DEFAULT_UNITS = ['개'];

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
        <h3 style={{ fontSize: '1.0625rem', fontWeight: '800', minWidth: 0 }}>
          {skill.name} <span style={{ color: 'var(--sub-text)', fontWeight: 600, fontSize: '0.875rem' }}>준비물 {skill.supplies.length}</span>
        </h3>
        <button className="btn-small btn-primary" onClick={() => setIsAdding(true)}>+ 추가</button>
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
                  <td style={{ fontWeight: '600', fontSize: '0.875rem' }}>{supply.supplyName}</td>
                  <td>{supply.quantity}</td>
                  <td>{supply.unit}</td>
                  <td style={{ color: 'var(--sub-text)', fontSize: '0.8125rem' }}>{supply.note || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleStartEditSupply(supply)} className="txt-btn">수정</button>
                      <button onClick={() => handleDelete(supply.id)} className="txt-btn danger">삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {skill.supplies.length === 0 && !isAdding && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--sub-text)' }}>
                  등록된 준비물이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .section-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
        .supply-form-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 16px;
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
        th { font-size: 0.75rem; font-weight: 700; color: var(--sub-text); padding: 8px 10px; text-align: left; background: #f8fafc; }
        td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }
        table { width: 100%; border-collapse: collapse; }
        .card-table { overflow-x: auto; }
        .txt-btn {
          background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 6px;
          font-size: 0.75rem; font-weight: 700; color: var(--sub-text); white-space: nowrap;
        }
        .txt-btn:hover { background: #f1f5f9; color: var(--text); }
        .txt-btn.danger:hover { background: #fee2e2; color: #b91c1c; }
        @media (max-width: 600px) {
          th:nth-child(4), td:nth-child(4) { display: none; }
          .form-grid { grid-template-columns: 1fr 1fr; }
          .form-item.wide { grid-column: span 2; }
        }
      `}</style>
    </div>
  );
}
