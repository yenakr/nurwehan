'use client';

import { useState, useEffect } from 'react';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';
import { isAdminRole } from '@/lib/auth-core';

interface CalendarClientProps {
  initialOfficialEvents: any[];
  user: any;
}

export default function CalendarClient({
  initialOfficialEvents,
  user,
}: CalendarClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>(user?.grade || 3);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda' | 'semester'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Official events
  const [officialEvents, setOfficialEvents] = useState<any[]>(initialOfficialEvents);

  // Personal events
  const [personalEvents, setPersonalEvents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('PERSONAL');
  const [newMemo, setNewMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Admin event modal
  const [showAdminAddModal, setShowAdminAddModal] = useState(false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminDate, setAdminDate] = useState('');
  const [adminCategory, setAdminCategory] = useState('OFFICIAL');
  const [adminTargetGrade, setAdminTargetGrade] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [adminMemo, setAdminMemo] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Event Detail & Edit Modal state
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTargetGrade, setEditTargetGrade] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [editDescription, setEditDescription] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (user) {
      fetch('/api/calendar/personal')
        .then(res => res.json())
        .then(data => {
          if (data.events) setPersonalEvents(data.events);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleOpenEventDetail = (e: any) => {
    setSelectedEvent(e);
    setIsEditingEvent(false);
    setEditTitle(e.title || '');
    const dateStr = e.startDateTime ? new Date(e.startDateTime).toISOString().split('T')[0] : '';
    setEditDate(dateStr);
    setEditCategory(e.category || (e.isPersonal ? 'PERSONAL' : 'OFFICIAL'));
    if (e.isCommon || !e.applicableGrades || e.applicableGrades.length === 4) {
      setEditTargetGrade('all');
    } else {
      setEditTargetGrade(String(e.applicableGrades[0]) as any);
    }
    setEditDescription(e.description || '');
  };

  const handleAddPersonalEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/calendar/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          startDateTime: newDate,
          category: newCategory,
          description: newMemo,
        }),
      });
      const data = await res.json();
      if (data.event) {
        setPersonalEvents(prev => [...prev, data.event]);
        setNewTitle('');
        setNewDate('');
        setNewMemo('');
        setShowAddModal(false);
      }
    } catch (err) {
      alert('개인 일정 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOfficialEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle || !adminDate) return;
    setAdminSubmitting(true);
    try {
      const isCommon = adminTargetGrade === 'all';
      const applicableGrades = isCommon ? [1, 2, 3, 4] : [Number(adminTargetGrade)];

      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adminTitle,
          startDateTime: adminDate,
          category: adminCategory,
          academicYear: 2026,
          applicableGrades,
          isCommon,
          description: adminMemo,
          status: 'PUBLISHED',
        }),
      });
      const data = await res.json();
      if (data.event) {
        setOfficialEvents(prev => [...prev, data.event]);
        setAdminTitle('');
        setAdminDate('');
        setAdminMemo('');
        setShowAdminAddModal(false);
      } else {
        alert('행사 일정 등록에 실패했습니다.');
      }
    } catch (err) {
      alert('일정 등록 중 오류가 발생했습니다.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleSaveEventEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !editTitle || !editDate) return;
    setEditSubmitting(true);
    try {
      if (selectedEvent.isPersonal) {
        const res = await fetch('/api/calendar/personal', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedEvent.id,
            title: editTitle,
            startDateTime: editDate,
            category: editCategory,
            description: editDescription,
          }),
        });
        if (res.ok) {
          setPersonalEvents(prev =>
            prev.map(ev =>
              ev.id === selectedEvent.id
                ? { ...ev, title: editTitle, startDateTime: editDate, category: editCategory, description: editDescription }
                : ev
            )
          );
          setSelectedEvent(null);
        } else {
          alert('개인 일정 수정 실패');
        }
      } else {
        // Official Event Edit (Admin)
        const isCommon = editTargetGrade === 'all';
        const applicableGrades = isCommon ? [1, 2, 3, 4] : [Number(editTargetGrade)];

        const res = await fetch('/api/admin/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedEvent.id,
            title: editTitle,
            startDateTime: editDate,
            category: editCategory,
            isCommon,
            applicableGrades,
            description: editDescription,
            status: selectedEvent.status || 'PUBLISHED',
          }),
        });
        if (res.ok) {
          setOfficialEvents(prev =>
            prev.map(ev =>
              ev.id === selectedEvent.id
                ? { ...ev, title: editTitle, startDateTime: editDate, category: editCategory, isCommon, applicableGrades, description: editDescription }
                : ev
            )
          );
          setSelectedEvent(null);
        } else {
          alert('공식 일정 수정 실패');
        }
      }
    } catch (err) {
      alert('일정 수정 중 오류가 발생했습니다.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeletePersonalEvent = async (id: string) => {
    if (!confirm('이 개인 일정을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/calendar/personal?id=${id}`, { method: 'DELETE' });
      setPersonalEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleDeleteOfficialEvent = async (id: string) => {
    if (!confirm('이 공식 일정을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/admin/calendar?id=${id}`, { method: 'DELETE' });
      setOfficialEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch (err) {
      alert('삭제 실패');
    }
  };

  // Combine official & personal events
  const allCombinedEvents = [
    ...officialEvents.map(e => ({ ...e, isPersonal: false })),
    ...personalEvents.map(e => ({ ...e, isPersonal: true })),
  ];

  // Filter events
  const filteredEvents = allCombinedEvents.filter(e => {
    if (!e.isPersonal && selectedGrade !== 'all') {
      if (!e.isCommon && e.applicableGrades && !e.applicableGrades.includes(selectedGrade)) {
        return false;
      }
    }
    if (selectedCategory !== 'all' && e.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Category labels map
  const categoryLabels: Record<string, string> = {
    all: '전체 카테고리',
    OFFICIAL: '공식 행사',
    STUDENT_COUNCIL: '학생회 행사',
    ACADEMIC: '수업/학업',
    EXAM: '시험',
    CLINICAL: '실습',
    HEALTH: '건강요건',
    OPEN_LAB: 'OPEN LAB',
    CAREER: '취업/어학',
    CAMPUS: '연구/비교과',
    PERSONAL: '개인 일정',
  };

  // Helper date formatting
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  // Render Days for Month View
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    monthCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    monthCells.push(new Date(currentYear, currentMonth, d));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              📅 통합 캘린더
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              학사일정, 중간/기말고사, 임상실습 OT, OPEN LAB 일정 및 개인 시험 일정을 관리하세요. (일정을 클릭하면 상세정보 및 수정을 진행할 수 있습니다)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isAdmin && (
              <button
                onClick={() => setShowAdminAddModal(true)}
                className="btn-primary"
                style={{ fontSize: '0.84rem' }}
              >
                + 공식/행사 일정 추가 (관리자)
              </button>
            )}
            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-accent"
                style={{ fontSize: '0.84rem' }}
              >
                + 개인 일정 추가
              </button>
            )}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              {(['month', 'week', 'agenda', 'semester'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8125rem',
                    fontWeight: viewMode === mode ? 700 : 500,
                    backgroundColor: viewMode === mode ? 'var(--primary)' : 'var(--white)',
                    color: viewMode === mode ? '#FFFFFF' : 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'month' ? '월간' : mode === 'week' ? '주간' : mode === 'agenda' ? '목록' : '학기'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)' }}>학년:</span>
            {['all', 1, 2, 3, 4].map(g => (
              <button
                key={String(g)}
                onClick={() => setSelectedGrade(g as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8125rem',
                  fontWeight: selectedGrade === g ? 700 : 500,
                  backgroundColor: selectedGrade === g ? 'var(--primary)' : 'var(--muted-background)',
                  color: selectedGrade === g ? '#FFFFFF' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {g === 'all' ? '전체 학년' : `${g}학년`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)' }}>카테고리:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Section */}
      {viewMode === 'month' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={prevMonth} className="btn-outline" style={{ padding: '4px 12px' }}>◀ 이전달</button>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                {currentYear}년 {currentMonth + 1}월
              </h3>
              <button onClick={nextMonth} className="btn-outline" style={{ padding: '4px 12px' }}>다음달 ▶</button>
              <button onClick={todayMonth} className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.8125rem' }}>오늘</button>
            </div>
          </div>

          {/* Month Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => (
              <div
                key={dayName}
                style={{
                  backgroundColor: 'var(--muted-background)',
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: idx === 0 ? '#DC2626' : idx === 6 ? '#2563EB' : 'var(--text)',
                }}
              >
                {dayName}
              </div>
            ))}

            {monthCells.map((dateObj, idx) => {
              if (!dateObj) {
                return <div key={`empty-${idx}`} style={{ backgroundColor: '#F8FAFC', minHeight: '90px' }} />;
              }

              const dayStr = dateObj.toISOString().split('T')[0];
              const dayEvents = filteredEvents.filter(e => {
                const eDate = new Date(e.startDateTime).toISOString().split('T')[0];
                return eDate === dayStr;
              });

              const isToday = dayStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={dayStr}
                  style={{
                    backgroundColor: isToday ? '#EFF6FF' : '#FFFFFF',
                    minHeight: '100px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--primary)' : 'var(--text)' }}>
                    {dateObj.getDate()}일
                  </div>

                  {dayEvents.map(e => (
                    <div
                      key={e.id}
                      onClick={() => handleOpenEventDetail(e)}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        backgroundColor: e.isPersonal ? '#FEF3C7' : '#E0F2FE',
                        color: e.isPersonal ? '#92400E' : '#0369A1',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                      title={`${e.title} (클릭하여 상세 보기)`}
                    >
                      {e.isPersonal ? '[개인] ' : ''}{e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(viewMode === 'agenda' || viewMode === 'week' || viewMode === 'semester') && (
        <div className="card">
          <h3 className="section-title">
            <span>📋 일정 상세 목록 ({filteredEvents.length}건) - 클릭시 상세정보 및 수정</span>
          </h3>

          {filteredEvents.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>구분</th>
                    <th>일정명</th>
                    <th>대상 학년</th>
                    <th>상세 / 관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(e => (
                    <tr
                      key={e.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenEventDetail(e)}
                    >
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {new Date(e.startDateTime).toLocaleDateString('ko-KR')}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: e.isPersonal ? '#FEF3C7' : '#E2E8F0', color: e.isPersonal ? '#92400E' : '#334155' }}>
                          {categoryLabels[e.category] || e.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{e.title}</td>
                      <td>{e.isCommon ? '전학년 공통' : e.applicableGrades?.map((g: number) => `${g}학년`).join(', ') || '개인'}</td>
                      <td>
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleOpenEventDetail(e);
                          }}
                          className="btn-outline"
                          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        >
                          상세 / 수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState type="preparing" />
          )}
        </div>
      )}

      {/* Add Personal Event Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>
              ✏️ 개인 일정 등록
            </h3>
            <form onSubmit={handleAddPersonalEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>일정 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 토익 시험, 면접 준비, 개인 과제"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>날짜 *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>상세 메모</label>
                <textarea
                  rows={3}
                  placeholder="메모나 특이사항을 적어주세요."
                  value={newMemo}
                  onChange={e => setNewMemo(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline">
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Official Event Modal */}
      {showAdminAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>
              📢 새 공식/학사 일정 등록 (관리자)
            </h3>
            <form onSubmit={handleAddOfficialEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>일정명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 3학년 임상실습 OT, 중간고사"
                  value={adminTitle}
                  onChange={e => setAdminTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>날짜 *</label>
                  <input
                    type="date"
                    required
                    value={adminDate}
                    onChange={e => setAdminDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>대상 학년</label>
                  <select
                    value={adminTargetGrade}
                    onChange={e => setAdminTargetGrade(e.target.value as any)}
                    style={{ width: '100%' }}
                  >
                    <option value="all">전체 학년 공통</option>
                    <option value="1">1학년만</option>
                    <option value="2">2학년만</option>
                    <option value="3">3학년만</option>
                    <option value="4">4학년만</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>카테고리</label>
                <select
                  value={adminCategory}
                  onChange={e => setAdminCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {Object.entries(categoryLabels).filter(([k]) => k !== 'all' && k !== 'PERSONAL').map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>상세 설명</label>
                <textarea
                  rows={3}
                  placeholder="일정 설명 또는 준비사항"
                  value={adminMemo}
                  onChange={e => setAdminMemo(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAdminAddModal(false)} className="btn-outline">
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={adminSubmitting}>
                  {adminSubmitting ? '등록 중...' : '공식 일정 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAIL & EDIT MODAL */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
            {!isEditingEvent ? (
              /* VIEW MODE */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: selectedEvent.isPersonal ? '#FEF3C7' : '#E0F2FE',
                        color: selectedEvent.isPersonal ? '#92400E' : '#0369A1',
                      }}
                    >
                      {selectedEvent.isPersonal ? '개인 일정' : '공식/학사 일정'} ({categoryLabels[selectedEvent.category] || selectedEvent.category})
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', marginTop: '8px', marginBottom: '4px' }}>
                      {selectedEvent.title}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.8125rem' }}>
                    닫기 ✕
                  </button>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
                  <div>
                    <strong>📅 날짜:</strong> {new Date(selectedEvent.startDateTime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                  <div>
                    <strong>🎓 대상 학년:</strong> {selectedEvent.isPersonal ? '개인' : (selectedEvent.isCommon ? '전학년 공통' : selectedEvent.applicableGrades?.map((g: number) => `${g}학년`).join(', '))}
                  </div>
                  {selectedEvent.description && (
                    <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                      <strong>📝 상세 설명:</strong>
                      <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.5 }}>
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {(selectedEvent.isPersonal || isAdmin) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedEvent.isPersonal) {
                            handleDeletePersonalEvent(selectedEvent.id);
                          } else {
                            handleDeleteOfficialEvent(selectedEvent.id);
                          }
                        }}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ 삭제
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingEvent(true)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700 }}
                      >
                        ✏️ 일정 수정
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>
                  ✏️ 일정 정보 수정
                </h3>
                <form onSubmit={handleSaveEventEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>일정 제목 *</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>날짜 *</label>
                      <input
                        type="date"
                        required
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    {!selectedEvent.isPersonal ? (
                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>대상 학년</label>
                        <select
                          value={editTargetGrade}
                          onChange={e => setEditTargetGrade(e.target.value as any)}
                          style={{ width: '100%' }}
                        >
                          <option value="all">전체 학년 공통</option>
                          <option value="1">1학년만</option>
                          <option value="2">2학년만</option>
                          <option value="3">3학년만</option>
                          <option value="4">4학년만</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>카테고리</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="PERSONAL">개인 일정</option>
                          <option value="EXAM">개인 시험/자격증</option>
                          <option value="ACADEMIC">학업/과제</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>상세 설명 / 메모</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingEvent(false)}
                      className="btn-outline"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={editSubmitting}
                    >
                      {editSubmitting ? '저장 중...' : '💾 저장'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
