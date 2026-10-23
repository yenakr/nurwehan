'use client';

import { useState, useEffect, useMemo } from 'react';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';
import { isAdminRole } from '@/lib/auth-core';
import styles from './calendar.module.css';

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
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const startOfWeek = (d: Date) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - x.getDay());
    return x;
  };
  const currentSemester = () => {
    const n = new Date();
    const m = n.getMonth() + 1;
    return m >= 3 && m <= 8 ? { year: n.getFullYear(), half: 1 } : { year: m >= 9 ? n.getFullYear() : n.getFullYear() - 1, half: 2 };
  };
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [sem, setSem] = useState<{ year: number; half: number }>(currentSemester);
  
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

  // Local YYYY-MM-DD date formatter without UTC offset bug
  const formatYYYYMMDD = (dInput: Date | string) => {
    if (!dInput) return '';
    if (typeof dInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dInput)) {
      return dInput;
    }
    const d = new Date(dInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 선택한 날짜(기본: 오늘)의 일정
  const activeDay = selectedDay || formatYYYYMMDD(new Date());
  const selectedDayEvents = filteredEvents
    .filter(e => formatYYYYMMDD(e.startDateTime) === activeDay)
    .sort((a, b) => Number(!!a.isPersonal) - Number(!!b.isPersonal));

  // 주요(공식) 일정: 오늘 이후 가까운 순
  const todayYmd = formatYYYYMMDD(new Date());
  const majorEvents = filteredEvents
    .filter(e => !e.isPersonal && formatYYYYMMDD(e.startDateTime) >= todayYmd)
    .sort((a, b) => formatYYYYMMDD(a.startDateTime).localeCompare(formatYYYYMMDD(b.startDateTime)))
    .slice(0, 6);
  const ddayOf = (e: any) => {
    const [y, m, d] = formatYYYYMMDD(e.startDateTime).split('-').map(Number);
    const diff = Math.round((new Date(y, m - 1, d).getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) / 86400000);
    return diff === 0 ? 'D-Day' : `D-${diff}`;
  };
  const mdLabel = (e: any) => {
    const [, m, d] = formatYYYYMMDD(e.startDateTime).split('-').map(Number);
    return `${m}월 ${d}일`;
  };
  const selectedDayLabel = (() => {
    const [y, m, d] = activeDay.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${m}월 ${d}일 (${['일', '월', '화', '수', '목', '금', '토'][dt.getDay()]})`;
  })();

  // 주간 / 목록 / 학기 보기용
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const shiftWeek = (n: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7 * n);
    setWeekStart(d);
  };
  const eventsOn = (ds: string) =>
    filteredEvents
      .filter(e => formatYYYYMMDD(e.startDateTime) === ds)
      .sort((a, b) => Number(!!a.isPersonal) - Number(!!b.isPersonal));
  const dateLabel = (ds: string) => {
    const [y, m, d] = ds.split('-').map(Number);
    return `${m}월 ${d}일 (${['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()]})`;
  };
  const upcomingGroups = (() => {
    const map = new Map<string, any[]>();
    filteredEvents
      .filter(e => formatYYYYMMDD(e.startDateTime) >= todayYmd)
      .sort((a, b) => formatYYYYMMDD(a.startDateTime).localeCompare(formatYYYYMMDD(b.startDateTime)))
      .forEach(e => {
        const k = formatYYYYMMDD(e.startDateTime);
        map.set(k, [...(map.get(k) || []), e]);
      });
    return Array.from(map.entries());
  })();
  const shiftSem = (n: number) => {
    const idx = sem.year * 2 + (sem.half - 1) + n;
    setSem({ year: Math.floor(idx / 2), half: (idx % 2) + 1 });
  };
  const semMonths = Array.from({ length: 6 }, (_, i) => {
    // 1학기: 3~8월 / 2학기: 9월~다음 해 2월
    const startMonth = sem.half === 1 ? 3 : 9;
    const mm = startMonth + i;
    const year = sem.year + (mm > 12 ? 1 : 0);
    const month = mm > 12 ? mm - 12 : mm;
    return { year, month, key: `${year}-${String(month).padStart(2, '0')}` };
  });

  // Render Grid Cells for Month View (Real Calendar App Style with Prev/Next month trailing/leading days)
  const monthGridCells = useMemo(() => {
    const cells: Array<{
      dateObj: Date;
      isCurrentMonth: boolean;
      dayStr: string;
      dayNumber: number;
      monthNumber: number;
    }> = [];

    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

    // 1. Previous Month Trailing Days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({
        dateObj: d,
        isCurrentMonth: false,
        dayStr,
        dayNumber: d.getDate(),
        monthNumber: d.getMonth() + 1,
      });
    }

    // 2. Current Month Days
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateObj,
        isCurrentMonth: true,
        dayStr,
        dayNumber: d,
        monthNumber: currentMonth + 1,
      });
    }

    // 3. Next Month Leading Days to complete grid row (multiple of 7)
    const totalSoFar = cells.length;
    const remainder = totalSoFar % 7;
    if (remainder > 0) {
      const nextDaysNeeded = 7 - remainder;
      for (let d = 1; d <= nextDaysNeeded; d++) {
        const dateObj = new Date(currentYear, currentMonth + 1, d);
        const nextMonthNum = dateObj.getMonth() + 1;
        const dayStr = `${dateObj.getFullYear()}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({
          dateObj,
          isCurrentMonth: false,
          dayStr,
          dayNumber: d,
          monthNumber: nextMonthNum,
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div className="card" style={{ padding: '16px' }}>
        <div className={styles.head}>
          <div className={styles.titleRow}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>캘린더</h2>
            {user && (
              <div className={styles.menuWrap}>
                <button
                  className={styles.plus}
                  aria-label="일정 추가"
                  onClick={() => (isAdmin ? setShowAddMenu(v => !v) : setShowAddModal(true))}
                >
                  +
                </button>
                {isAdmin && showAddMenu && (
                  <div className={styles.menu}>
                    <button onClick={() => { setShowAddMenu(false); setShowAddModal(true); }}>개인 일정</button>
                    <button onClick={() => { setShowAddMenu(false); setShowAdminAddModal(true); }}>공식 일정</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.seg} style={{ alignSelf: 'flex-start' }}>
            {(['month', 'week', 'agenda', 'semester'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={viewMode === mode ? styles.on : ''}>
                {mode === 'month' ? '월간' : mode === 'week' ? '주간' : mode === 'agenda' ? '목록' : '학기'}
              </button>
            ))}
          </div>

          <div className={styles.filters}>
            <div className={styles.chips}>
              {['all', 1, 2, 3, 4].map(g => (
                <button
                  key={String(g)}
                  onClick={() => setSelectedGrade(g as any)}
                  className={`${styles.chip} ${selectedGrade === g ? styles.on : ''}`}
                >
                  {g === 'all' ? '전체' : `${g}학년`}
                </button>
              ))}
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '0.8125rem' }}
              aria-label="카테고리"
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
        <div className="card" style={{ padding: '16px' }}>
          <div className={styles.nav}>
            <h3 className={styles.navTitle}>
              {currentYear}년 {currentMonth + 1}월
            </h3>
            <div className={styles.navBtns}>
              <button onClick={prevMonth} className={`btn-outline ${styles.navBtn}`} aria-label="이전 달">‹</button>
              <button onClick={todayMonth} className={`btn-outline ${styles.navBtn}`} style={{ fontSize: '0.8125rem' }}>오늘</button>
              <button onClick={nextMonth} className={`btn-outline ${styles.navBtn}`} aria-label="다음 달">›</button>
            </div>
          </div>

          <div className={styles.grid}>
            {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => (
              <div key={dayName} className={styles.dow} style={{ color: idx === 0 ? '#DC2626' : idx === 6 ? '#2563EB' : 'var(--text)' }}>
                {dayName}
              </div>
            ))}

            {monthGridCells.map(cell => {
              const dayEvents = filteredEvents
                .filter(e => formatYYYYMMDD(e.startDateTime) === cell.dayStr)
                .sort((a, b) => Number(!!a.isPersonal) - Number(!!b.isPersonal));
              const isToday = cell.dayStr === formatYYYYMMDD(new Date());
              const shown = dayEvents.slice(0, 3);
              return (
                <button
                  type="button"
                  key={cell.dayStr}
                  onClick={() => setSelectedDay(cell.dayStr)}
                  className={`${styles.cell} ${cell.isCurrentMonth ? '' : styles.out} ${isToday ? styles.today : ''} ${activeDay === cell.dayStr ? styles.sel : ''}`}
                >
                  <span className={styles.num}>{cell.isCurrentMonth ? cell.dayNumber : `${cell.monthNumber}/${cell.dayNumber}`}</span>
                  {shown.map(e => (
                    <span key={e.id} className={`${styles.ev} ${e.isPersonal ? styles.me : e.category === 'EXAM' ? styles.exam : ''}`}>
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > shown.length && <span className={styles.more}>+{dayEvents.length - shown.length}</span>}
                </button>
              );
            })}
          </div>

          {/* 선택한 날짜의 일정 */}
          <div className={styles.dayPanel}>
            <div className={styles.dayTitle}>{selectedDayLabel}</div>
            {selectedDayEvents.length === 0 ? (
              <div className={styles.empty}>일정이 없어요.</div>
            ) : (
              selectedDayEvents.map(e => (
                <div key={e.id} onClick={() => handleOpenEventDetail(e)} className={`${styles.dayItem} ${e.isPersonal ? styles.me : e.category === 'EXAM' ? styles.exam : ''}`}>
                  {e.isPersonal ? '[개인] ' : ''}
                  {e.title}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="card" style={{ padding: '16px' }}>
          <div className={styles.majorTitle}>주요 일정</div>
          {majorEvents.length === 0 ? (
            <div className={styles.empty}>예정된 주요 일정이 없어요.</div>
          ) : (
            majorEvents.map(e => (
              <div key={e.id} onClick={() => handleOpenEventDetail(e)} className={`${styles.majorItem} ${e.category === 'EXAM' ? styles.exam : ''}`}>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.majorName}>{e.title}</div>
                  <div className={styles.majorDate}>{mdLabel(e)}</div>
                </div>
                <span className={styles.dday}>{ddayOf(e)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'week' && (
        <div className="card" style={{ padding: '16px' }}>
          <div className={styles.weekHead}>
            <h3 className={styles.navTitle} style={{ fontSize: '1rem' }}>
              {weekDays[0].getMonth() + 1}/{weekDays[0].getDate()} – {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}
            </h3>
            <div className={styles.navBtns}>
              <button onClick={() => shiftWeek(-1)} className={`btn-outline ${styles.navBtn}`} aria-label="이전 주">‹</button>
              <button onClick={() => setWeekStart(startOfWeek(new Date()))} className={`btn-outline ${styles.navBtn}`} style={{ fontSize: '0.8125rem' }}>이번 주</button>
              <button onClick={() => shiftWeek(1)} className={`btn-outline ${styles.navBtn}`} aria-label="다음 주">›</button>
            </div>
          </div>
          {weekDays.map(d => {
            const ds = formatYYYYMMDD(d);
            const evs = eventsOn(ds);
            return (
              <div
                key={ds}
                className={`${styles.weekRow} ${ds === todayYmd ? styles.today : ''} ${d.getDay() === 0 ? styles.weekend : d.getDay() === 6 ? `${styles.weekend} ${styles.sat}` : ''}`}
              >
                <div className={styles.weekDay}>
                  {d.getDate()}
                  <small>{['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}</small>
                </div>
                <div>
                  {evs.length === 0 ? (
                    <div className={styles.none}>일정 없음</div>
                  ) : (
                    evs.map(e => (
                      <div key={e.id} onClick={() => handleOpenEventDetail(e)} className={`${styles.dayItem} ${e.isPersonal ? styles.me : e.category === 'EXAM' ? styles.exam : ''}`}>
                        {e.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'agenda' && (
        <div className="card" style={{ padding: '16px' }}>
          {upcomingGroups.length === 0 ? (
            <div className={styles.empty}>앞으로 예정된 일정이 없어요.</div>
          ) : (
            upcomingGroups.map(([ds, evs]) => (
              <div key={ds}>
                <div className={styles.aDate}>{dateLabel(ds)}</div>
                {evs.map(e => (
                  <div key={e.id} onClick={() => handleOpenEventDetail(e)} className={`${styles.dayItem} ${e.isPersonal ? styles.me : e.category === 'EXAM' ? styles.exam : ''}`}>
                    <span className={styles.cat}>{categoryLabels[e.category] || ''}</span>
                    {e.title}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'semester' && (
        <div className="card" style={{ padding: '16px' }}>
          <div className={styles.weekHead}>
            <h3 className={styles.navTitle} style={{ fontSize: '1rem' }}>
              {sem.year}학년도 {sem.half}학기
            </h3>
            <div className={styles.navBtns}>
              <button onClick={() => shiftSem(-1)} className={`btn-outline ${styles.navBtn}`} aria-label="이전 학기">‹</button>
              <button onClick={() => setSem(currentSemester())} className={`btn-outline ${styles.navBtn}`} style={{ fontSize: '0.8125rem' }}>이번 학기</button>
              <button onClick={() => shiftSem(1)} className={`btn-outline ${styles.navBtn}`} aria-label="다음 학기">›</button>
            </div>
          </div>
          <div className={styles.semGrid}>
            {semMonths.map(m => {
              const evs = filteredEvents
                .filter(e => {
                  const ds = formatYYYYMMDD(e.startDateTime);
                  return ds.startsWith(m.key);
                })
                .sort((a, b) => formatYYYYMMDD(a.startDateTime).localeCompare(formatYYYYMMDD(b.startDateTime)));
              return (
                <div key={m.key} className={styles.semMonth}>
                  <div className={styles.semMonthHead}>
                    {m.month}월
                    <span>{evs.length ? `${evs.length}건` : ''}</span>
                  </div>
                  {evs.length === 0 && <div className={styles.none}>—</div>}
                  {evs.map(e => (
                    <div
                      key={e.id}
                      onClick={() => handleOpenEventDetail(e)}
                      className={`${styles.semItem} ${e.isPersonal ? styles.me : `${styles.off} ${e.category === 'EXAM' ? styles.exam : ''}`}`}
                    >
                      <b>{Number(formatYYYYMMDD(e.startDateTime).split('-')[2])}일</b>
                      <span>{e.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
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
              개인 일정 등록
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
              공식 일정 등록
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
                    닫기
                  </button>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
                  <div>
                    <strong>날짜</strong> {new Date(selectedEvent.startDateTime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                  <div>
                    <strong>대상</strong> {selectedEvent.isPersonal ? '개인' : (selectedEvent.isCommon ? '전학년 공통' : selectedEvent.applicableGrades?.map((g: number) => `${g}학년`).join(', '))}
                  </div>
                  {selectedEvent.description && (
                    <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                      <strong>설명</strong>
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
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingEvent(true)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700 }}
                      >
                        수정
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>
                  일정 수정
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
                      {editSubmitting ? '저장 중...' : '저장'}
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
