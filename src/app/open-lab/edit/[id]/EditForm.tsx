'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EditApplication {
  id: string;
  ruleId: string | null;
  selectedGrade: number;
  confirmedNotice: boolean;
  additionalRequest: string | null;
  otherSkillName: string | null;
  status: string;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    maxCapacity: number;
  };
  skills: Array<{
    skillId: string;
  }>;
}

interface EditFormProps {
  user: {
    id: string;
    name: string;
    studentId: string;
    phone: string;
    grade: number;
  };
  application: EditApplication;
}

interface Skill {
  id: string;
  name: string;
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

export default function EditForm({ user, application }: EditFormProps) {
  const router = useRouter();
  
  // Data State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  
  // Filter State
  const [gradeFilter, setGradeFilter] = useState(application.selectedGrade.toString());
  const [roomFilter, setRoomFilter] = useState('전체');
  
  // Selection State (Initialized from application)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>({
    ruleId: application.ruleId || '', // Assuming ruleId is passed or we find it
    date: application.slot.date.split('T')[0],
    startTime: application.slot.startTime,
    endTime: application.slot.endTime,
    room: application.slot.room,
    grade: application.selectedGrade,
    maxCapacity: application.slot.maxCapacity,
    remaining: 0 // Will be updated
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>(application.skills.map(as => as.skillId) || []);
  const [otherSkillName, setOtherSkillName] = useState(application.otherSkillName || '');
  const [confirmedNotice] = useState(true);
  const [additionalRequest, setAdditionalRequest] = useState(application.additionalRequest || '');
  
  const [submitting, setSubmitting] = useState(false);

  // Initial Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        setSkills([...skillsData, { id: 'other', name: '기타' }]);

        const slotsRes = await fetch('/api/open-lab/available-slots');
        const slotsData = await slotsRes.json();
        setAllSlots(slotsData);
        
        // Find matching slot in available slots if exists
        const matching = slotsData.find((s: Slot) => 
          s.date === application.slot.date.split('T')[0] && 
          s.startTime === application.slot.startTime && 
          s.room === application.slot.room
        );
        if (matching) setSelectedSlot(matching);
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchInitialData();
  }, [application]);

  const filteredSlots = allSlots.filter(slot => {
    const gradeMatch = gradeFilter === '전체' || slot.grade.toString() === gradeFilter;
    const roomMatch = roomFilter === '전체' || slot.room === roomFilter;
    return gradeMatch && roomMatch;
  });

  const handleSkillChange = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      if (selectedSkills.length >= 2) return alert('최대 2개 술기까지 가능합니다.');
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return alert('슬롯을 선택해주세요.');
    if (selectedSkills.length === 0) return alert('술기를 선택해주세요.');
    if (selectedSkills.includes('other') && !otherSkillName.trim()) return alert('기타 술기명을 입력해주세요.');

    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/open-lab/apply/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: selectedSlot.ruleId,
          date: selectedSlot.date,
          room: selectedSlot.room,
          grade: selectedSlot.grade,
          skillIds: selectedSkills,
          otherSkillName: selectedSkills.includes('other') ? otherSkillName : undefined,
          additionalRequest,
          confirmedNotice
        })
      });
      
      if (res.ok) {
        alert('신청 내용이 수정되었습니다.');
        router.push('/history');
      } else {
        const data = await res.json();
        alert(data.message || '수정에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="apply-form">
      <section className="form-section">
        <h3 className="section-title">1. 신청 슬롯 수정</h3>
        
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
          <div className="loading-slots">불러오는 중...</div>
        ) : (
          <div className="slots-grid">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime && selectedSlot?.room === slot.room;
              return (
                <button
                  key={`${slot.date}-${slot.startTime}-${slot.room}`}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`slot-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="slot-date">{new Date(slot.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}</div>
                  <div className="slot-time">{slot.startTime} ~ {slot.endTime}</div>
                  <div className="slot-room">{slot.room}</div>
                  <div className="slot-footer">
                    <span className="slot-grade">{slot.grade}학년</span>
                    <span className="slot-capacity">{slot.remaining}명 가능</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Rest of the form is same as ApplyForm */}
      <section className="form-section">
        <h3 className="section-title">2. 실습 술기 수정</h3>
        <div className="skills-grid">
          {skills.map(skill => (
            <label key={skill.id} className={`skill-item ${selectedSkills.includes(skill.id) ? 'checked' : ''}`}>
              <input type="checkbox" checked={selectedSkills.includes(skill.id)} onChange={() => handleSkillChange(skill.id)} />
              <span>{skill.name}</span>
            </label>
          ))}
        </div>
        {selectedSkills.includes('other') && (
          <div className="other-skill-input">
            <label>기타 술기명</label>
            <input type="text" value={otherSkillName} onChange={(e) => setOtherSkillName(e.target.value)} />
          </div>
        )}
      </section>

      <section className="form-section">
        <h3 className="section-title">3. 관리자 전달사항 (이메일 본문 추가)</h3>
        <textarea 
          placeholder="추가로 필요한 물품이나 요청사항이 있으면 작성해주세요. 작성하신 내용은 신청 완료 후 메일 전송 화면의 이메일 본문 하단에 자동으로 추가됩니다. (예: 수액세트 2개 추가 요청합니다)"
          value={additionalRequest}
          onChange={(e) => setAdditionalRequest(e.target.value)}
          style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
        />
      </section>

      <div className="submit-area">
        <button type="submit" disabled={submitting || !selectedSlot} className="btn-submit">
          {submitting ? '수정 중...' : '신청 내용 수정 완료'}
        </button>
        <Link href="/history" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: 'var(--sub-text)', fontSize: '0.875rem' }}>취소하고 목록으로</Link>
      </div>

      <style jsx>{`
        /* Same as ApplyForm styles */
        .apply-form { display: flex; flex-direction: column; gap: 40px; }
        .form-section { background: white; padding: 32px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .section-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 24px; }
        .filters { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border); background: white; font-size: 0.875rem; cursor: pointer; }
        .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .slot-card { padding: 16px; border: 2px solid #f1f5f9; border-radius: 12px; background: white; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
        .slot-card.selected { border-color: var(--primary); background: #f0f7ff; }
        .slot-date { font-weight: 800; }
        .slot-time { color: var(--primary); font-weight: 600; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .skill-item { padding: 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
        .skill-item.checked { background: #f0f7ff; border-color: var(--primary); font-weight: 700; }
        .confirmation-section { background: #fff9db; padding: 24px; border-radius: 12px; border: 1px solid #ffe066; }
        .btn-submit { width: 100%; padding: 20px; background: var(--primary); color: white; border: none; border-radius: 12px; font-size: 1.125rem; font-weight: 800; cursor: pointer; }
      `}</style>
    </form>
  );
}
