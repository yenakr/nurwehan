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
  };
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

const ROOM_OPTIONS = ['전체', '임상수기실습실 5층', '시뮬레이션실습실 6층'];
const GRADE_OPTIONS = ['전체', '2학년', '3학년', '4학년'];

export default function ApplyForm({ user }: ApplyFormProps) {
  const router = useRouter();
  
  // Data State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  
  // Filter State
  const [gradeFilter, setGradeFilter] = useState(user.grade.toString());
  const [roomFilter, setRoomFilter] = useState('전체');
  
  // Selection State
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillName, setOtherSkillName] = useState('');
  const [confirmedNotice, setConfirmedNotice] = useState(false);
  const [additionalRequest, setAdditionalRequest] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        setSkills([...skillsData, { id: 'other', name: '기타', supplies: [] }]);

        const slotsRes = await fetch('/api/open-lab/available-slots');
        const slotsData = await slotsRes.json();
        setAllSlots(slotsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Filter Logic
  const filteredSlots = allSlots.filter(slot => {
    const gradeMatch = gradeFilter === '전체' || slot.grade.toString() === gradeFilter;
    const roomMatch = roomFilter === '전체' || slot.room === roomFilter;
    return gradeMatch && roomMatch;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return alert('신청할 슬롯을 선택해주세요.');
    if (selectedSkills.length === 0) return alert('술기를 하나 이상 선택해주세요.');
    if (selectedSkills.includes('other') && !otherSkillName.trim()) return alert('기타 술기명을 입력해주세요.');
    if (!confirmedNotice) return alert('이용 안내 및 유의사항 확인이 필요합니다.');
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/open-lab/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: selectedSlot.ruleId,
          date: selectedSlot.date,
          room: selectedSlot.room,
          grade: selectedSlot.grade,
          skillIds: selectedSkills,
          otherSkillName: selectedSkills.includes('other') ? otherSkillName : undefined,
          participants: [{ studentId: user.studentId, name: user.name }], // Now single participant only as per rules
          additionalRequest,
          confirmedNotice
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('신청서가 접수되었습니다.');
        router.push('/history');
      } else {
        alert(data.message || '신청에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="apply-form">
      {/* 1. Slot Selection Section */}
      <section className="form-section">
        <h3 className="section-title">1. 신청 가능한 슬롯 선택</h3>
        
        <div className="filters">
          <div className="filter-group">
            <label>학년 필터</label>
            <div className="filter-buttons">
              {GRADE_OPTIONS.map(g => (
                <button 
                  key={g} 
                  type="button"
                  onClick={() => setGradeFilter(g === '전체' ? '전체' : g.replace('학년', ''))}
                  className={`filter-btn ${gradeFilter === (g === '전체' ? '전체' : g.replace('학년', '')) ? 'active' : ''}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-group">
            <label>실습실 필터</label>
            <div className="filter-buttons">
              {ROOM_OPTIONS.map(r => (
                <button 
                  key={r} 
                  type="button"
                  onClick={() => setRoomFilter(r)}
                  className={`filter-btn ${roomFilter === r ? 'active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingSlots ? (
          <div className="loading-slots">신청 가능한 슬롯을 불러오는 중...</div>
        ) : filteredSlots.length === 0 ? (
          <div className="no-slots">현재 신청 가능한 슬롯이 없습니다.</div>
        ) : (
          <div className="slots-grid">
            {filteredSlots.map((slot, idx) => {
              const isSelected = selectedSlot?.ruleId === slot.ruleId && selectedSlot?.date === slot.date && selectedSlot?.room === slot.room;
              const dateObj = new Date(slot.date);
              const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
              
              return (
                <button
                  key={`${slot.ruleId}-${slot.date}-${slot.room}`}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`slot-card ${isSelected ? 'selected' : ''} ${slot.remaining <= 0 ? 'disabled' : ''}`}
                  disabled={slot.remaining <= 0}
                >
                  <div className="slot-date">{dateStr}</div>
                  <div className="slot-time">{slot.startTime} ~ {slot.endTime}</div>
                  <div className="slot-room">{slot.room}</div>
                  <div className="slot-footer">
                    <span className="slot-grade">{slot.grade}학년 전용</span>
                    <span className={`slot-capacity ${slot.remaining <= 2 ? 'low' : ''}`}>
                      {slot.remaining === 0 ? '마감' : `잔여 ${slot.remaining}명`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Skill Selection */}
      <section className="form-section">
        <h3 className="section-title">2. 실습 술기 선택 (최대 2개)</h3>
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

      {/* 3. Additional Info */}
      <section className="form-section">
        <h3 className="section-title">3. 추가 정보</h3>
        <div className="info-box">
          <div className="info-item">
            <label>신청자</label>
            <div className="info-value">{user.name} ({user.studentId})</div>
          </div>
          <div className="info-item">
            <label>연락처</label>
            <div className="info-value">{user.phone}</div>
          </div>
        </div>
        
        <div className="textarea-group">
          <label>추가 요청사항</label>
          <textarea 
            placeholder="추가로 필요한 물품이나 요청사항이 있으면 작성해주세요."
            value={additionalRequest}
            onChange={(e) => setAdditionalRequest(e.target.value)}
          />
        </div>
      </section>

      {/* 4. Confirmation */}
      <section className="confirmation-section">
        <label className="confirm-label">
          <input 
            type="checkbox" 
            checked={confirmedNotice} 
            onChange={(e) => setConfirmedNotice(e.target.checked)}
          />
          <span>OPEN LAB 이용 안내 및 유의사항을 확인했습니다. (필수)</span>
        </label>
        <Link href="/notices" target="_blank" className="notice-link">이용 안내 전문 보기</Link>
      </section>

      <div className="submit-area">
        <button 
          type="submit" 
          disabled={submitting || !selectedSlot || selectedSkills.length === 0 || !confirmedNotice}
          className="btn-submit"
        >
          {submitting ? '제출 중...' : '사용 신청서 제출'}
        </button>
      </div>

      <style jsx>{`
        .apply-form {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .form-section {
          background: white;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 24px;
          color: var(--text);
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
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .slot-card {
          padding: 20px;
          border: 2px solid #f1f5f9;
          border-radius: 12px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slot-card:hover:not(.disabled) {
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }
        .slot-card.selected {
          border-color: var(--primary);
          background: #f0f7ff;
        }
        .slot-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }
        .slot-date {
          font-weight: 800;
          font-size: 0.9375rem;
          color: var(--text);
        }
        .slot-time {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
        }
        .slot-room {
          font-size: 0.8125rem;
          color: var(--sub-text);
        }
        .slot-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .slot-capacity.low {
          color: #ef4444;
        }

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
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
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
      `}</style>
    </form>
  );
}
