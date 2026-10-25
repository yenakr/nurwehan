'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApplyFormProps {
  user: {
    id: string;
    name: string;
    studentId: string;
    phone: string;
    grade: number;
    role?: string;
  } | null;
}

interface Skill {
  id: string;
  name: string;
  supplies: Array<{
    supplyName: string;
    quantity: number;
    unit: string;
    note: string | null;
  }>;
}

interface Slot {
  ruleId: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  grade: number;
  maxCapacity: number;
  remaining: number;
  isAvailable?: boolean;
  deadlineText?: string;
}

const GRADE_OPTIONS = ['2학년', '3학년', '4학년'];

const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  '2': ['기본간호학실습1', '기본간호학실습2'],
  '3': ['핵심술기실습1', '성인간호실습1', '성인간호실습2', '여성간호실습'],
  '4': [
    '간호관리실습',
    '아동간호실습',
    '정신간호실습',
    '노인간호실습',
    '심화통합실습',
    '임상종합실습',
    '지역사회간호실습',
    '지역사회정신간호실습'
  ]
};

export default function ApplyForm({ user }: ApplyFormProps) {
  const router = useRouter();
  
  // Data State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Guest Details State
  const [guestName, setGuestName] = useState('');
  const [guestStudentId, setGuestStudentId] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [myPhone, setMyPhone] = useState('');
  const [guestGrade, setGuestGrade] = useState('2');

  // Form Fields State
  const [subject, setSubject] = useState('');
  const [professor, setProfessor] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // Filter State
  const [gradeFilter, setGradeFilter] = useState(user ? user.grade.toString() : '2');
  
  // Selection State
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillName, setOtherSkillName] = useState('');
  const [confirmedNotice] = useState(true);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [accompanyingNames, setAccompanyingNames] = useState('');
  const [totalCount, setTotalCount] = useState('1');
  
  // Custom schedule inputs
  const [customDate, setCustomDate] = useState('');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [customRoom, setCustomRoom] = useState('임상수기실습실 (5층)');
  
  // Skill search
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  // Phone Formatter
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  // 2. Initial Data Fetch (Skills, Slots, and Templates if logged in)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const skillsRes = await fetch('/api/skills');
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          if (Array.isArray(skillsData)) {
            const filteredDBData = skillsData.filter((s: Skill) => s.name !== '기타' && s.id !== 'other');
            setSkills([...filteredDBData, { id: 'other', name: '기타', supplies: [] }]);
          }
        }

        const slotsRes = await fetch('/api/open-lab/available-slots');
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          if (Array.isArray(slotsData)) {
            setAllSlots(slotsData);
          }
        }

        if (user) {
          const templatesRes = await fetch('/api/open-lab/templates');
          if (templatesRes.ok) {
            const templatesData = await templatesRes.json();
            if (Array.isArray(templatesData)) {
              setTemplates(templatesData);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // Sync grade filter with guestGrade when not logged in
  useEffect(() => {
    if (!user) {
      setGradeFilter(guestGrade);
      // Reset selected slot if it doesn't match the new grade and is not custom
      if (selectedSlot && selectedSlot.grade.toString() !== guestGrade && selectedSlot.ruleId !== 'custom') {
        setSelectedSlot(null);
      }
    }
  }, [guestGrade, user, selectedSlot]);

  // Dynamic subject dropdown auto-population based on gradeFilter
  useEffect(() => {
    const subjects = SUBJECTS_BY_GRADE[gradeFilter] || [];
    if (subjects.length > 0) {
      setSubject(subjects[0]);
    } else {
      setSubject('');
    }
  }, [gradeFilter]);

  // Dynamic totalCount synchronization based on accompanyingNames
  useEffect(() => {
    const accompanyingList = accompanyingNames
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);
    setTotalCount((1 + accompanyingList.length).toString());
  }, [accompanyingNames]);

  // 3. Filter Logic
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'ASSISTANT' || user.role === 'SUPER_ADMIN');
  const filteredSlots = allSlots.filter(slot => {
    const isMatchingGrade = slot.grade.toString() === gradeFilter;
    if (isAdmin) return isMatchingGrade;
    return isMatchingGrade && (slot.isAvailable ?? false);
  });

  const handleSkillChange = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      if (selectedSkills.length >= 2) {
        alert('한 타임에는 최대 2개 술기까지 신청할 수 있습니다.');
        return;
      }
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };



  // Load past templates
  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setSubject('');
      setProfessor('');
      setPurpose('');
      setAdditionalRequest('');
      setSelectedSkills([]);
      setOtherSkillName('');
      setAccompanyingNames('');
      return;
    }
    const t = templates.find(temp => temp.id === templateId);
    if (!t) return;
    
    setSubject(t.subject || '');
    setProfessor(t.professor || '');
    setPurpose(t.purpose || '');
    setAdditionalRequest(t.additionalRequest || '');
    
    const skillIds = t.skills.map((s: any) => s.skillId);
    if (t.otherSkillName) {
      skillIds.push('other');
      setOtherSkillName(t.otherSkillName);
    }
    setSelectedSkills(skillIds);
    
    if (t.participants && t.participants.length > 0) {
      const others = t.participants.filter((p: any) => p.studentId !== user?.studentId);
      setAccompanyingNames(others.map((o: any) => o.name).join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (!guestName.trim()) return alert('이름을 입력해주세요.');
      if (!guestStudentId.trim()) return alert('학번을 입력해주세요.');
      if (!guestPhone.trim()) return alert('연락처를 입력해주세요.');
    } else if (!user.phone && !myPhone.trim()) {
      return alert('연락처를 입력해주세요.');
    }
    if (!subject.trim()) return alert('실습과목을 입력해주세요.');
    if (!professor.trim()) return alert('담당교수를 입력해주세요.');
    if (!selectedSlot) return alert('신청할 일정을 선택해주세요.');
    if (selectedSlot.ruleId === 'custom') {
      if (!customDate) return alert('대체 일정 날짜를 선택해주세요.');
      if (!customStartTime.trim() || !customEndTime.trim()) return alert('대체 일정 시작 시간과 종료 시간을 입력해주세요.');
    }
    if (selectedSkills.length === 0) return alert('술기를 하나 이상 선택해주세요.');
    if (selectedSkills.includes('other') && !otherSkillName.trim()) return alert('기타 술기명을 입력해주세요.');
    
    setSubmitting(true);
    try {
      const repName = user ? user.name : guestName;
      const repStudentId = user ? user.studentId : guestStudentId;

      const accompanyingList = accompanyingNames
        .split(',')
        .map(n => n.trim())
        .filter(Boolean)
        .filter(n => n !== repName);

      // Pad with dummy names if totalCount is greater than representative + accompanying list size
      const totalEntered = 1 + accompanyingList.length;
      const neededPadding = Math.max(0, parseInt(totalCount || '1') - totalEntered);
      
      for (let i = 0; i < neededPadding; i++) {
        accompanyingList.push(`동반학생 ${i + 1}`);
      }

      const parsedAccompanying = accompanyingList.map((name, idx) => ({
        studentId: `accompanying-${idx}-${name}`,
        name
      }));

      const payloadParticipants = [
        { studentId: repStudentId, name: repName },
        ...parsedAccompanying
      ];

      // Convert selected skills to purpose string automatically
      const skillNames = selectedSkills
        .map(id => {
          if (id === 'other') return otherSkillName;
          return skills.find(s => s.id === id)?.name || '';
        })
        .filter(Boolean)
        .join(', ');
      const autoPurpose = `${skillNames} 실습`;

      const payload = {
        ruleId: selectedSlot.ruleId,
        date: selectedSlot.ruleId === 'custom' ? customDate : selectedSlot.date,
        room: selectedSlot.ruleId === 'custom' ? customRoom : selectedSlot.room,
        grade: selectedSlot.grade,
        skillIds: selectedSkills,
        otherSkillName: selectedSkills.includes('other') ? otherSkillName : undefined,
        participants: payloadParticipants,
        additionalRequest,
        confirmedNotice: true,
        subject,
        professor,
        purpose: autoPurpose,
        ...(selectedSlot.ruleId === 'custom' ? {
          customStartTime,
          customEndTime
        } : {}),
        ...(user ? {} : {
          guestName,
          guestStudentId,
          guestPhone,
          guestGrade: parseInt(guestGrade)
        })
      };

      if (user && !user.phone) {
        const saved = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: myPhone.trim() }),
        });
        if (!saved.ok) {
          alert('연락처를 저장하지 못했습니다.');
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/open-lab/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('신청서 생성이 완료되었습니다.');
        router.push(`/open-lab/success/${data.id}`);
      } else {
        alert(data.message || '신청서를 만들지 못했어요.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="apply-form">
      {/* 0. Template Selection (Only for logged-in users) */}
      {user && templates.length > 0 && (
        <div className="template-box">
          <label>최근 신청 불러오기</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleLoadTemplate(e.target.value)}
            className="template-select"
          >
            <option value="">직접 새로 입력</option>
            {templates.map(t => {
              const dateObj = new Date(t.slot.date);
              const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
              return (
                <option key={t.id} value={t.id}>
                  [{dateStr} {t.slot.room}] {t.subject} ({t.professor} 교수님)
                </option>
              );
            })}
          </select>
        </div>
      )}

       {/* 1. Applicant Details */}
      <section className="form-section">
        <h3 className="section-title">신청자</h3>
        {user ? (
          <div className="info-box">
            <div className="info-item">
              <label>이름</label>
              <div className="info-value">{user.name} ({user.studentId})</div>
            </div>
            <div className="info-item">
              <label>연락처</label>
              {user.phone ? (
                <div className="info-value">{user.phone}</div>
              ) : (
                <input
                  type="text"
                  placeholder="010-XXXX-XXXX"
                  value={myPhone}
                  onChange={e => setMyPhone(formatPhoneNumber(e.target.value))}
                />
              )}
            </div>
            <div className="info-item">
              <label>학년</label>
              <div className="info-value">{user.grade}학년</div>
            </div>
          </div>
        ) : (
          <div className="guest-inputs">
            <div className="input-row">
              <div className="input-group">
                <label>이름</label>
                <input 
                  type="text" 
                  placeholder="이름 입력" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>학번</label>
                <input 
                  type="text" 
                  placeholder="학번 입력 (8자리)" 
                  value={guestStudentId}
                  onChange={(e) => setGuestStudentId(e.target.value)}
                />
              </div>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>연락처</label>
                <input 
                  type="text" 
                  placeholder="010-XXXX-XXXX" 
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(formatPhoneNumber(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label>학년</label>
                <div className="grade-buttons" style={{ display: 'flex', gap: '8px' }}>
                  {['2', '3', '4'].map(g => (
                    <button 
                      key={g} 
                      type="button"
                      onClick={() => setGuestGrade(g)}
                      className={`filter-btn ${guestGrade === g ? 'active' : ''}`}
                      style={{ flex: 1, padding: '10px', height: '100%', fontSize: '0.875rem' }}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Practice Paper Details (Subject, Professor) */}
      <section className="form-section">
        <h3 className="section-title">실습 정보</h3>
        <div className="input-row">
          <div className="input-group">
            <label>실습과목 <span className="req">*</span></label>
            <select 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-select"
            >
              {(SUBJECTS_BY_GRADE[gradeFilter] || []).map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>담당교수 <span className="req">*</span></label>
            <input 
              type="text" 
              placeholder="예: 김간호 교수님" 
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 3. Schedule Selection Section */}
      <section className="form-section">
        <h3 className="section-title">일정</h3>
        
        {user && (
          <div className="filters">
            <div className="filter-group">
              <label>학년 필터</label>
              <div className="filter-buttons">
                {GRADE_OPTIONS.map(g => (
                  <button 
                    key={g} 
                    type="button"
                    onClick={() => setGradeFilter(g.replace('학년', ''))}
                    className={`filter-btn ${gradeFilter === g.replace('학년', '') ? 'active' : ''}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loadingSlots ? (
          <div className="loading-slots">신청 가능한 시간을 불러오는 중...</div>
        ) : filteredSlots.length === 0 ? (
          <div className="no-slots">신청 가능한 일정이 없어요.</div>
        ) : (
          <div className="slot-groups">
            {Object.entries(
              filteredSlots.reduce<Record<string, typeof filteredSlots>>((acc, sl) => {
                (acc[sl.date] = acc[sl.date] || []).push(sl);
                return acc;
              }, {})
            ).map(([date, list]) => (
              <div key={date} className="slot-group">
                <div className="slot-date">
                  <span>{new Date(date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                  {list[0]?.deadlineText && <em>마감 {list[0].deadlineText}</em>}
                </div>
                {list.map(slot => {
                  const isSelected = selectedSlot?.ruleId === slot.ruleId && selectedSlot?.date === slot.date && selectedSlot?.room === slot.room;
                  return (
                    <button
                      key={`${slot.ruleId}-${slot.date}-${slot.room}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`slot-row ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="slot-main">
                        <b>{slot.startTime} ~ {slot.endTime}</b>
                        <em>{slot.room}</em>
                      </span>
                      <span className="slot-side">
                        <b>{slot.maxCapacity - slot.remaining}/{slot.maxCapacity}명</b>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSelectedSlot({
                ruleId: 'custom',
                date: customDate,
                startTime: customStartTime,
                endTime: customEndTime,
                room: customRoom,
                grade: parseInt(gradeFilter),
                maxCapacity: 20,
                remaining: 20
              })}
              className={`slot-row custom ${selectedSlot?.ruleId === 'custom' ? 'selected' : ''}`}
            >
              <span className="slot-main"><b>기타 일정</b><em>직접 입력 (공휴일·대체)</em></span>
            </button>
          </div>
        )}

        <p className="slot-note">작성 인원은 이 사이트에서 만든 신청서만 집계돼요.</p>

        {selectedSlot?.ruleId === 'custom' && (
          <div className="custom-schedule-inputs" style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text)' }}>대체 일정 상세 입력</h4>
            <div className="input-row">
              <div className="input-group">
                <label>실습 날짜</label>
                <input 
                  type="date" 
                  value={customDate} 
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setSelectedSlot(prev => prev ? { ...prev, date: e.target.value } : null);
                  }}
                />
              </div>
              <div className="input-group">
                <label>실습실</label>
                <select 
                  value={customRoom} 
                  onChange={(e) => {
                    setCustomRoom(e.target.value);
                    setSelectedSlot(prev => prev ? { ...prev, room: e.target.value } : null);
                  }}
                  className="form-select"
                >
                  <option value="임상수기실습실 (5층)">임상수기실습실 (5층)</option>
                  <option value="시뮬레이션실습실(6층)">시뮬레이션실습실(6층)</option>
                </select>
              </div>
            </div>
            <div className="input-row" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>시작 시간 (HH:mm)</label>
                <input 
                  type="text" 
                  placeholder="예: 09:00" 
                  value={customStartTime} 
                  onChange={(e) => {
                    setCustomStartTime(e.target.value);
                    setSelectedSlot(prev => prev ? { ...prev, startTime: e.target.value } : null);
                  }}
                />
              </div>
              <div className="input-group">
                <label>종료 시간 (HH:mm)</label>
                <input 
                  type="text" 
                  placeholder="예: 12:00" 
                  value={customEndTime} 
                  onChange={(e) => {
                    setCustomEndTime(e.target.value);
                    setSelectedSlot(prev => prev ? { ...prev, endTime: e.target.value } : null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Skill Selection */}
      <section className="form-section">
        <h3 className="section-title">술기 <small>최대 2개</small></h3>
        
        <div style={{ marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="술기 검색" 
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 600 }}
          />
        </div>

        <div className="skills-chips">
          {skills
            .filter(skill => skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
            .map(skill => (
              <label key={skill.id} className={`skill-chip ${selectedSkills.includes(skill.id) ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={selectedSkills.includes(skill.id)} 
                  onChange={() => handleSkillChange(skill.id)}
                />
                <span>{skill.name}</span>
              </label>
            ))}
        </div>
        {selectedSkills.includes('other') && (
          <div className="other-skill-input">
            <label>기타 술기명</label>
            <input 
              type="text" 
              placeholder="직접 입력해주세요" 
              value={otherSkillName}
              onChange={(e) => setOtherSkillName(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* 5. Participants + notes */}
      <section className="form-section">
        <h3 className="section-title">인원 · 전달사항</h3>
        <div className="input-row">
          <div className="input-group" style={{ flex: '0 0 120px' }}>
            <label>총 인원 <span className="req">*</span></label>
            <input
              type="number"
              min="1"
              value={totalCount}
              onChange={(e) => setTotalCount(e.target.value)}
              placeholder="본인 포함"
            />
          </div>
          <div className="input-group">
            <label>동반 학생 (선택)</label>
            <input
              type="text"
              placeholder="김민지, 이서연"
              value={accompanyingNames}
              onChange={(e) => setAccompanyingNames(e.target.value)}
            />
          </div>
        </div>
        <div className="textarea-group" style={{ marginTop: '16px' }}>
          <textarea
            placeholder="전달사항 (선택)"
            value={additionalRequest}
            onChange={(e) => setAdditionalRequest(e.target.value)}
          />
        </div>
      </section>

      <div className="submit-area">
        <button 
          type="submit" 
          disabled={submitting || !selectedSlot || selectedSkills.length === 0}
          className="btn-submit"
        >
          {submitting ? '생성 중...' : '신청서 생성하기'}
        </button>
      </div>

      <style jsx>{`
        .apply-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .template-box {
          background: #f0f7ff;
          padding: 20px;
          border-radius: 12px;
          border: 1px dashed var(--primary);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .template-box label {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--primary);
        }
        .template-select {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-weight: 600;
        }
        .form-section {
          background: white;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid var(--border);
          position: relative;
        }
        .section-title {
          font-size: 1.0625rem;
          font-weight: 800;
          margin-bottom: 16px;
          color: var(--text);
        }
        .section-title small { font-size: 0.8125rem; font-weight: 600; color: var(--sub-text); margin-left: 6px; }
        .slot-groups { display: flex; flex-direction: column; gap: 14px; }
        .slot-group { display: flex; flex-direction: column; gap: 6px; }
        .slot-date { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-weight: 800; font-size: 0.9375rem; color: var(--text); margin-bottom: 2px; }
        .slot-date em { font-style: normal; font-size: 0.75rem; font-weight: 600; color: #ef4444; }
        .slot-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: white; text-align: left; cursor: pointer; }
        .slot-row.selected { border-color: var(--primary); background: #f0f7ff; box-shadow: inset 0 0 0 1px var(--primary); }
        .slot-row.custom { border-style: dashed; }
        .slot-main, .slot-side { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .slot-side { text-align: right; flex: 0 0 auto; }
        .slot-main b { font-size: 0.9375rem; font-weight: 800; color: var(--primary); }
        .slot-side b { font-size: 0.875rem; font-weight: 800; color: var(--text); }
        .slot-main em, .slot-side em { font-style: normal; font-size: 0.75rem; color: var(--sub-text); }
        .slot-note { font-size: 0.75rem; color: var(--sub-text); margin: 12px 0 0; }
        .skills-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-chip { display: inline-flex; align-items: center; padding: 8px 14px; border: 1px solid var(--border); border-radius: 999px; font-size: 0.875rem; font-weight: 600; cursor: pointer; background: white; }
        .skill-chip input { display: none; }
        .skill-chip.checked { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 700; }
        
        .req {
          color: #ef4444;
        }

        .guest-inputs {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-row {
          display: flex;
          gap: 16px;
        }
        .input-row .input-group {
          flex: 1;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--sub-text);
        }
        .input-group input, .form-select {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
        }
        
        .filters {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .filter-group label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--sub-text);
        }
        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover {
          background: #f8fafc;
        }
        .filter-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .slot-card {
          padding: 24px;
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }
        .slot-card:hover:not(.disabled) {
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }
        .slot-card.selected {
          border-color: #0E4A84;
          background: #f0f7ff;
          box-shadow: 0 4px 12px rgba(14, 74, 132, 0.1);
        }
        .slot-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #fcfcfc;
          border-color: #f1f5f9;
        }
        
        .selection-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #0E4A84;
          color: white;
          font-size: 0.6875rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .slot-date {
          font-weight: 800;
          font-size: 1rem;
          color: var(--text);
          margin-bottom: 2px;
        }
        .slot-time {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--primary);
        }
        .slot-room {
          font-size: 0.8125rem;
          color: var(--sub-text);
          margin-bottom: 12px;
        }
        
        .capacity-badge {
          align-self: flex-start;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          margin-top: auto;
        }
        .capacity-badge.high { background: #dcfce7; color: #166534; }
        .capacity-badge.low { background: #ffedd5; color: #9a3412; }
        .capacity-badge.full { background: #fee2e2; color: #991b1b; }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        .skill-item {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .skill-item.checked {
          background: #f0f7ff;
          border-color: var(--primary);
          font-weight: 700;
        }
        .other-skill-input {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .other-skill-input label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .other-skill-input input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .info-box {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .info-item label {
          font-size: 0.75rem;
          color: var(--sub-text);
          margin-bottom: 4px;
          display: block;
        }
        .info-value {
          font-weight: 700;
          font-size: 0.9375rem;
        }

        .btn-add-p {
          background: #f0f7ff;
          color: var(--primary);
          border: 1px solid var(--primary);
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-p:hover {
          background: var(--primary);
          color: white;
        }
        
        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .participant-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .row-num {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--sub-text);
          width: 20px;
          text-align: center;
        }
        .participant-row .input-group {
          flex: 1;
        }
        .participant-row input {
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          width: 100%;
        }
        .btn-remove-p {
          background: #fee2e2;
          color: #ef4444;
          border: 1px solid #fca5a5;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-remove-p:hover {
          background: #ef4444;
          color: white;
        }
        .rep-tag {
          background: #e0f2fe;
          color: #0369a1;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 6px;
          text-align: center;
          min-width: 58px;
        }

        .textarea-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .textarea-group textarea {
          width: 100%;
          height: 100px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          resize: none;
        }

        .confirmation-section {
          background: #fff9db;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #ffe066;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .confirm-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .confirm-label input {
          width: 20px;
          height: 20px;
          margin-top: 2px;
        }
        .notice-link {
          margin-left: 32px;
          font-size: 0.8125rem;
          color: var(--primary);
          text-decoration: underline;
        }

        .submit-area {
          margin-top: 20px;
        }
        .btn-submit {
          width: 100%;
          padding: 20px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.125rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn-submit:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
        
        @media (max-width: 600px) {
          .info-box { grid-template-columns: 1fr; }
          .form-section { padding: 18px 16px; }
          .input-row { flex-direction: column; gap: 16px; }
        }
      `}</style>
    </form>
  );
}
