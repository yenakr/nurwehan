'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApplyFormProps {
  user: {
    name: string;
    studentId: string;
    phone: string;
    grade: number;
  };
}

interface Skill {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  maxCapacity: number;
  _count?: {
    applications: number;
  };
}

export default function ApplyForm({ user }: ApplyFormProps) {
  const router = useRouter();
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [participants, setParticipants] = useState([{ studentId: user.studentId, name: user.name }]);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, slotsRes] = await Promise.all([
          fetch('/api/skills'),
          fetch(`/api/open-lab/slots?grade=${user.grade}`)
        ]);
        const skillsData = await skillsRes.json();
        const slotsData = await slotsRes.json();
        setSkills(skillsData);
        setSlots(slotsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user.grade]);

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

  const addParticipant = () => {
    setParticipants([...participants, { studentId: '', name: '' }]);
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setParticipants(newParticipants);
  };

  const removeParticipant = (index: number) => {
    if (index === 0) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return alert('일정을 선택해주세요.');
    if (selectedSkills.length === 0) return alert('술기를 하나 이상 선택해주세요.');
    
    setLoading(true);
    try {
      const res = await fetch('/api/open-lab/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlotId,
          skillIds: selectedSkills,
          participants,
          additionalRequest
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('신청서가 접수되었습니다. 관리자 승인 후 최종 확정됩니다.');
        router.push('/history');
      } else {
        alert(data.message || '신청에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* 1. Applicant Info */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>1. 신청자 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', backgroundColor: 'var(--muted-background)', padding: '20px', borderRadius: '4px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>대표 신청자</label>
            <div style={{ fontWeight: '600' }}>{user.name} ({user.studentId})</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>연락처</label>
            <div style={{ fontWeight: '600' }}>{user.phone}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>학년</label>
            <div style={{ fontWeight: '600' }}>{user.grade}학년</div>
          </div>
        </div>
      </section>

      {/* 2. Slot Selection */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>2. 일정 및 장소 선택</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>선택</th>
                <th>날짜 / 요일</th>
                <th>시간</th>
                <th>실습실</th>
                <th>잔여/정원</th>
              </tr>
            </thead>
            <tbody>
              {slots.length > 0 ? slots.map(slot => (
                <tr key={slot.id}>
                  <td>
                    <input 
                      type="radio" 
                      name="slot" 
                      value={slot.id} 
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                    />
                  </td>
                  <td>{new Date(slot.date).toLocaleDateString('ko-KR')} ({['일','월','화','수','목','금','토'][new Date(slot.date).getDay()]})</td>
                  <td>{slot.startTime} - {slot.endTime}</td>
                  <td>{slot.room}</td>
                  <td>{slot.maxCapacity - (slot._count?.applications || 0)} / {slot.maxCapacity}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--sub-text)' }}>
                    현재 신청 가능한 일정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Skill Selection */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>3. 실습 술기 선택 (최대 2개)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {skills.map(skill => (
            <label key={skill.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px', 
              border: '1px solid var(--border)', 
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedSkills.includes(skill.id) ? 'var(--muted-background)' : 'transparent',
              borderColor: selectedSkills.includes(skill.id) ? 'var(--primary)' : 'var(--border)'
            }}>
              <input 
                type="checkbox" 
                checked={selectedSkills.includes(skill.id)} 
                onChange={() => handleSkillChange(skill.id)}
              />
              <span style={{ fontSize: '0.875rem' }}>{skill.name}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 4. Participants */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>4. 참여 학생 명단</h3>
          <button type="button" onClick={addParticipant} className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            + 학생 추가
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {participants.map((p, index) => (
            <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="학번" 
                value={p.studentId} 
                readOnly={index === 0}
                onChange={(e) => updateParticipant(index, 'studentId', e.target.value)}
                style={{ flex: 1, minWidth: '120px', backgroundColor: index === 0 ? '#f0f0f0' : 'white' }}
              />
              <input 
                type="text" 
                placeholder="이름" 
                value={p.name} 
                readOnly={index === 0}
                onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                style={{ flex: 1, minWidth: '120px', backgroundColor: index === 0 ? '#f0f0f0' : 'white' }}
              />
              {index > 0 && (
                <button type="button" onClick={() => removeParticipant(index)} style={{ color: '#ef4444', fontSize: '1.25rem', padding: '0 8px' }}>×</button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Additional Request */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>5. 추가 요청사항</h3>
        <textarea 
          placeholder="기타 필요한 물품이나 요청사항이 있으면 작성해주세요."
          value={additionalRequest}
          onChange={(e) => setAdditionalRequest(e.target.value)}
          style={{ width: '100%', height: '100px', resize: 'none' }}
        />
      </section>

      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '32px', textAlign: 'center' }}>
        <button 
          type="submit" 
          disabled={loading}
          className="btn-accent" 
          style={{ width: '100%', padding: '16px' }}
        >
          {loading ? '신청 처리 중...' : '사용 신청서 제출'}
        </button>
      </div>
    </form>
  );
}
