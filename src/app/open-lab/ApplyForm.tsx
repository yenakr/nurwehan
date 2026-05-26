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
}

const GRADE_OPTIONS = ['2학년', '3학년', '4학년'];

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
  const [confirmedNotice, setConfirmedNotice] = useState(false);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [participants, setParticipants] = useState<Array<{ studentId: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  // 1. Initialize participants & Sync Guest details
  useEffect(() => {
    if (user) {
      setParticipants([{ studentId: user.studentId, name: user.name }]);
    } else {
      setParticipants([{ studentId: guestStudentId, name: guestName }]);
    }
  }, [user, guestName, guestStudentId]);

  // 2. Initial Data Fetch (Skills, Slots, and Templates if logged in)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        setSkills([...skillsData, { id: 'other', name: '기타', supplies: [] }]);

        const slotsRes = await fetch('/api/open-lab/available-slots');
        const slotsData = await slotsRes.json();
        setAllSlots(slotsData);

        if (user) {
          const templatesRes = await fetch('/api/open-lab/templates');
          const templatesData = await templatesRes.json();
          if (Array.isArray(templatesData)) {
            setTemplates(templatesData);
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
      // Reset selected slot if it doesn't match the new grade
      if (selectedSlot && selectedSlot.grade.toString() !== guestGrade) {
        setSelectedSlot(null);
      }
    }
  }, [guestGrade, user, selectedSlot]);

  // 3. Filter Logic
  const filteredSlots = allSlots.filter(slot => {
    return slot.grade.toString() === gradeFilter;
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

  // Participant list actions
  const addParticipant = () => {
    setParticipants([...participants, { studentId: '', name: '' }]);
  };

  const handleParticipantChange = (index: number, field: 'studentId' | 'name', value: string) => {
    const copy = [...participants];
    copy[index][field] = value;
    setParticipants(copy);
  };

  const removeParticipant = (index: number) => {
    if (index === 0) return;
    setParticipants(participants.filter((_, i) => i !== index));
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
      if (user) {
        setParticipants([{ studentId: user.studentId, name: user.name }]);
      }
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
      setParticipants([
        { studentId: user?.studentId || '', name: user?.name || '' },
        ...others.map((o: any) => ({ studentId: o.studentId, name: o.name }))
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (!guestName.trim()) return alert('이름을 입력해주세요.');
      if (!guestStudentId.trim()) return alert('학번을 입력해주세요.');
      if (!guestPhone.trim()) return alert('연락처를 입력해주세요.');
    }
    if (!subject.trim()) return alert('실습과목을 입력해주세요.');
    if (!professor.trim()) return alert('담당교수를 입력해주세요.');
    if (!purpose.trim()) return alert('실습목적을 입력해주세요.');
    if (!selectedSlot) return alert('신청할 일정을 선택해주세요.');
    if (selectedSkills.length === 0) return alert('술기를 하나 이상 선택해주세요.');
    if (selectedSkills.includes('other') && !otherSkillName.trim()) return alert('기타 술기명을 입력해주세요.');
    
    // Check if any participant fields are blank
    for (let i = 0; i < participants.length; i++) {
      if (!participants[i].name.trim() || !participants[i].studentId.trim()) {
        return alert('참여 학생의 이름과 학번을 모두 올바르게 입력해주세요.');
      }
    }

    if (!confirmedNotice) return alert('이용 안내 및 유의사항 확인이 필요합니다.');
    
    setSubmitting(true);
    try {
      const payload = {
        ruleId: selectedSlot.ruleId,
        date: selectedSlot.date,
        room: selectedSlot.room,
        grade: selectedSlot.grade,
        skillIds: selectedSkills,
        otherSkillName: selectedSkills.includes('other') ? otherSkillName : undefined,
        participants: participants.filter(p => p.studentId.trim() && p.name.trim()),
        additionalRequest,
        confirmedNotice,
        subject,
        professor,
        purpose,
        ...(user ? {} : {
          guestName,
          guestStudentId,
          guestPhone,
          guestGrade: parseInt(guestGrade)
        })
      };

      const res = await fetch('/api/open-lab/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('신청이 완료되었습니다. 신청서 페이지로 이동합니다.');
        router.push(`/open-lab/success/${data.id}`);
      } else {
        alert(data.message || '신청에 실패했습니다.');
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
          <label>⚡️ 최근 신청 내역 불러오기 (자동 완성)</label>
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
        <h3 className="section-title">1. 신청자 기본 정보</h3>
        {user ? (
          <div className="info-box">
            <div className="info-item">
              <label>이름</label>
              <div className="info-value">{user.name} ({user.studentId})</div>
            </div>
            <div className="info-item">
              <label>연락처</label>
              <div className="info-value">{user.phone}</div>
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
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>학년</label>
                <select 
                  value={guestGrade}
                  onChange={(e) => setGuestGrade(e.target.value)}
                  className="form-select"
                >
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">4학년</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Practice Paper Details (Subject, Professor, Purpose) */}
      <section className="form-section">
        <h3 className="section-title">2. 실습 상세 정보 (신청서 출력 양식 반영)</h3>
        <div className="input-row">
          <div className="input-group">
            <label>실습과목 <span className="req">*</span></label>
            <input 
              type="text" 
              placeholder="예: 기본간호학실습 (1)" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
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
        <div className="input-group" style={{ marginTop: '16px' }}>
          <label>실습목적 <span className="req">*</span></label>
          <input 
            type="text" 
            placeholder="예: 활력징후 측정 및 정맥주사 자율 실습" 
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>
      </section>

      {/* 3. Schedule Selection Section */}
      <section className="form-section">
        <h3 className="section-title">3. OPEN LAB 일정 선택</h3>
        
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
          <div className="no-slots">현재 선택하신 학년에서 신청 가능한 일정이 없습니다.</div>
        ) : (
          <div className="slots-grid">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.ruleId === slot.ruleId && selectedSlot?.date === slot.date && selectedSlot?.room === slot.room;
              const dateObj = new Date(slot.date);
              const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
              const isFull = slot.remaining <= 0;
              
              let capacityClass = 'high';
              if (isFull) capacityClass = 'full';
              else if (slot.remaining <= 3) capacityClass = 'low';

              return (
                <button
                  key={`${slot.ruleId}-${slot.date}-${slot.room}`}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`slot-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
                  disabled={isFull}
                >
                  {isSelected && <span className="selection-badge">선택됨</span>}
                  <div className="slot-date">{dateStr}</div>
                  <div className="slot-time">{slot.startTime} ~ {slot.endTime}</div>
                  <div className="slot-room">{slot.room}</div>
                  
                  <div className={`capacity-badge ${capacityClass}`}>
                    {isFull ? `마감 ${slot.maxCapacity} / ${slot.maxCapacity}명` : `잔여 ${slot.remaining} / ${slot.maxCapacity}명`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Skill Selection */}
      <section className="form-section">
        <h3 className="section-title">4. 실습 술기 선택 (최대 2개)</h3>
        <div className="skills-grid">
          {skills.map(skill => (
            <label key={skill.id} className={`skill-item ${selectedSkills.includes(skill.id) ? 'checked' : ''}`}>
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

      {/* 5. Participants Management */}
      <section className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>5. 참여 학생 명단</h3>
          <button 
            type="button" 
            onClick={addParticipant}
            className="btn-add-p"
          >
            + 학생 추가
          </button>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
          * 대표 신청자를 포함하여 실습실을 함께 사용하는 전원의 이름과 학번을 작성해주세요. (총 {participants.length}명)
        </p>

        <div className="participants-list">
          {participants.map((p, index) => (
            <div key={index} className="participant-row">
              <span className="row-num">{index + 1}</span>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="학번" 
                  value={p.studentId}
                  disabled={index === 0}
                  onChange={(e) => handleParticipantChange(index, 'studentId', e.target.value)}
                />
              </div>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="이름" 
                  value={p.name}
                  disabled={index === 0}
                  onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                />
              </div>
              {index > 0 ? (
                <button 
                  type="button" 
                  onClick={() => removeParticipant(index)}
                  className="btn-remove-p"
                >
                  삭제
                </button>
              ) : (
                <span className="rep-tag">대표</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Additional Info */}
      <section className="form-section">
        <h3 className="section-title">6. 추가 요청사항</h3>
        <div className="textarea-group">
          <label>추가 요청사항</label>
          <textarea 
            placeholder="추가로 필요한 물품이나 요청사항이 있으면 작성해주세요."
            value={additionalRequest}
            onChange={(e) => setAdditionalRequest(e.target.value)}
          />
        </div>
      </section>

      {/* 7. Confirmation */}
      <section className="confirmation-section">
        <label className="confirm-label">
          <input 
            type="checkbox" 
            checked={confirmedNotice} 
            onChange={(e) => setConfirmedNotice(e.target.checked)}
          />
          <span>OPEN LAB 이용 안내 확인 (필수)</span>
        </label>
        <Link href="/notices" target="_blank" className="notice-link">이용 안내 전문 보기</Link>
      </section>

      <div className="submit-area">
        <button 
          type="submit" 
          disabled={submitting || !selectedSlot || selectedSkills.length === 0 || !confirmedNotice}
          className="btn-submit"
        >
          {submitting ? '제출 중...' : '신청서 작성 완료 & PDF 출력 페이지로'}
        </button>
      </div>

      <style jsx>{`
        .apply-form {
          display: flex;
          flex-direction: column;
          gap: 40px;
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
          padding: 32px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          position: relative;
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 24px;
          color: var(--text);
        }
        
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
          .form-section { padding: 24px; }
          .slots-grid { grid-template-columns: 1fr; }
          .input-row { flex-direction: column; gap: 16px; }
        }
      `}</style>
    </form>
  );
}
