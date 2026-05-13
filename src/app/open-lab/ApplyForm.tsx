'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  supplies: Array<{
    supplyName: string;
    quantity: number;
    unit: string;
    note: string | null;
  }>;
}

interface Rule {
  id: string;
  grade: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  maxCapacity: number;
}

const ROOM_OPTIONS = ['임상수기실습실 5층', '시뮬레이션실습실 6층'];

export default function ApplyForm({ user }: ApplyFormProps) {
  const router = useRouter();
  
  // Master Data
  const [skills, setSkills] = useState<Skill[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  
  // Selection State
  const [selectedGrade, setSelectedGrade] = useState(user.grade);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[0]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkillName, setOtherSkillName] = useState('');
  const [confirmedNotice, setConfirmedNotice] = useState(false);
  
  // Capacity State
  const [capacityInfo, setCapacityInfo] = useState<{ remaining: number; maxCapacity: number } | null>(null);
  const [checkingCapacity, setCheckingCapacity] = useState(false);

  // Participant & Request State
  const [participants, setParticipants] = useState([{ studentId: user.studentId, name: user.name }]);
  const [additionalRequest, setAdditionalRequest] = useState('');
  
  const [loading, setLoading] = useState(false);

  // 1. Fetch Skills and Rules
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const skillsRes = await fetch('/api/skills');
        const skillsData = await skillsRes.json();
        // Add "기타" to the end
        setSkills([...skillsData, { id: 'other', name: '기타', supplies: [] }]);
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch(`/api/open-lab/rules?grade=${selectedGrade}`);
        const data = await res.json();
        setRules(data);
        setSelectedRuleId('');
        setSelectedDate('');
        setCapacityInfo(null);
      } catch (err) {
        console.error('Error fetching rules:', err);
      }
    };
    fetchRules();
  }, [selectedGrade]);

  // 2. Check Capacity when selections change
  useEffect(() => {
    if (!selectedRuleId || !selectedDate || !selectedRoom) {
      setCapacityInfo(null);
      return;
    }

    const checkCapacity = async () => {
      setCheckingCapacity(true);
      const rule = rules.find(r => r.id === selectedRuleId);
      if (!rule) return;

      try {
        const res = await fetch('/api/open-lab/check-capacity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            startTime: rule.startTime,
            endTime: rule.endTime,
            room: selectedRoom,
            grade: selectedGrade
          })
        });
        const data = await res.json();
        setCapacityInfo(data);
      } catch (err) {
        console.error('Error checking capacity:', err);
      } finally {
        setCheckingCapacity(false);
      }
    };

    checkCapacity();
  }, [selectedRuleId, selectedDate, selectedRoom, selectedGrade, rules]);

  // 3. Helper: Generate available dates for a rule (next 14 days)
  const getAvailableDates = (dayOfWeek: number) => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() === dayOfWeek) {
        dates.push(d);
      }
    }
    return dates;
  };

  const selectedRule = rules.find(r => r.id === selectedRuleId);
  const availableDates = selectedRule ? getAvailableDates(selectedRule.dayOfWeek) : [];

  // 4. Helper: Calculate aggregated supplies
  const getAggregatedSupplies = () => {
    const suppliesMap = new Map<string, { quantity: number; unit: string; note: string | null }>();
    
    selectedSkills.forEach(skillId => {
      const skill = skills.find(s => s.id === skillId);
      if (!skill) return;
      
      skill.supplies.forEach(s => {
        const existing = suppliesMap.get(s.supplyName);
        if (existing) {
          existing.quantity += s.quantity;
        } else {
          suppliesMap.set(s.supplyName, { quantity: s.quantity, unit: s.unit, note: s.note });
        }
      });
    });

    return Array.from(suppliesMap.entries()).map(([name, data]) => ({ name, ...data }));
  };

  const aggregatedSupplies = getAggregatedSupplies();

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

  const isOtherSelected = selectedSkills.includes('other');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule || !selectedDate || !selectedRoom) return alert('운영시간, 날짜, 실습실을 모두 선택해주세요.');
    if (selectedSkills.length === 0) return alert('술기를 하나 이상 선택해주세요.');
    if (isOtherSelected && !otherSkillName.trim()) return alert('기타 술기명을 입력해주세요.');
    if (!confirmedNotice) return alert('OPEN LAB 이용 안내 및 유의사항 확인이 필요합니다.');
    
    if (capacityInfo && capacityInfo.remaining < participants.length) {
      return alert('신청 가능 인원보다 참여 학생 수가 많습니다.');
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/open-lab/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: selectedRuleId,
          date: selectedDate,
          room: selectedRoom,
          grade: selectedGrade,
          skillIds: selectedSkills,
          otherSkillName: isOtherSelected ? otherSkillName : undefined,
          participants,
          additionalRequest,
          confirmedNotice
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
      {/* 1. Grade Selection */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>1. 학년 구분 선택</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[2, 3, 4].map(g => (
            <button 
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={selectedGrade === g ? 'btn-primary' : 'btn-outline'}
              style={{ flex: 1, padding: '12px' }}
            >
              {g}학년
            </button>
          ))}
        </div>
      </section>

      {/* 2. Schedule Selection */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>2. 운영시간 및 날짜 선택</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '8px' }}>운영시간 (요일/시간)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {rules.map(rule => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setSelectedRuleId(rule.id)}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: selectedRuleId === rule.id ? 'var(--primary)' : 'white',
                    color: selectedRuleId === rule.id ? 'white' : 'var(--text)',
                    fontSize: '0.875rem',
                    textAlign: 'left'
                  }}
                >
                  {['일','월','화','수','목','금','토'][rule.dayOfWeek]}요일 {rule.startTime} - {rule.endTime}
                </button>
              ))}
            </div>
          </div>

          {selectedRuleId && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '8px' }}>신청 가능 날짜</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {availableDates.map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        backgroundColor: selectedDate === dateStr ? 'var(--primary)' : 'white',
                        color: selectedDate === dateStr ? 'white' : 'var(--text)',
                        fontSize: '0.875rem'
                      }}
                    >
                      {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '8px' }}>실습실 선택</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {ROOM_OPTIONS.map(room => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: selectedRoom === room ? 'var(--primary)' : 'white',
                    color: selectedRoom === room ? 'white' : 'var(--text)',
                    fontSize: '0.875rem'
                  }}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          {capacityInfo && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: '600' }}>현재 신청 가능 인원</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '800', color: capacityInfo.remaining > 0 ? 'var(--primary)' : '#ef4444' }}>
                {capacityInfo.remaining} / {capacityInfo.maxCapacity} 명
              </span>
            </div>
          )}
          {checkingCapacity && <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>잔여 인원 확인 중...</div>}
        </div>
      </section>

      {/* 3. Skill Selection */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>3. 실습 술기 선택 (최대 2개)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: isOtherSelected ? '16px' : '0' }}>
          {skills.map(skill => (
            <label key={skill.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedSkills.includes(skill.id) ? '#f0f7ff' : 'transparent',
              borderColor: selectedSkills.includes(skill.id) ? 'var(--primary)' : 'var(--border)'
            }}>
              <input 
                type="checkbox" 
                checked={selectedSkills.includes(skill.id)} 
                onChange={() => handleSkillChange(skill.id)}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: selectedSkills.includes(skill.id) ? '600' : '400' }}>{skill.name}</span>
            </label>
          ))}
        </div>
        {isOtherSelected && (
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>기타 술기명 입력</label>
            <input 
              type="text" 
              placeholder="직접 입력 (예: 정맥주사 숙달 연습)" 
              value={otherSkillName}
              onChange={(e) => setOtherSkillName(e.target.value)}
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
        )}
      </section>

      {/* 4. Aggregate Supplies Display */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>4. 필요물품 목록</h3>
        {aggregatedSupplies.length > 0 ? (
          <div className="table-container" style={{ backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>품목명</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>수량</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>단위</th>
                  <th style={{ padding: '12px', fontSize: '0.8125rem' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedSupplies.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>{s.name}</td>
                    <td style={{ padding: '12px', fontSize: '0.875rem', textAlign: 'center', fontWeight: '700' }}>{s.quantity}</td>
                    <td style={{ padding: '12px', fontSize: '0.875rem' }}>{s.unit}</td>
                    <td style={{ padding: '12px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>{s.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--sub-text)' }}>
            {isOtherSelected ? '기타 술기 선택 시 필요한 물품을 아래 추가 요청사항에 직접 작성해주세요.' : '술기를 선택하면 필요물품이 표시됩니다.'}
          </div>
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--sub-text)', marginTop: '8px' }}>* 준비물은 선택한 술기에 맞춰 자동으로 계산되며 수정이 불가합니다.</p>
      </section>

      {/* 5. Participants */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>5. 신청자 정보</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--sub-text)', marginBottom: '4px' }}>학번</label>
              <input 
                type="text" 
                value={user.studentId} 
                readOnly 
                style={{ width: '100%', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--sub-text)', marginBottom: '4px' }}>이름</label>
              <input 
                type="text" 
                value={user.name} 
                readOnly 
                style={{ width: '100%', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>* 개별 신청만 가능합니다. 동반 학생이 있을 경우 각각 신청해 주세요.</p>
        </div>
      </section>

      {/* 6. Additional Request */}
      <section>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>6. 추가 요청사항</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '12px' }}>
          기본 필요물품 외 추가로 필요한 물품이나 요청사항이 있으면 작성해주세요.<br/>
          {isOtherSelected && <strong style={{ color: 'var(--primary)' }}>* 기타 술기를 선택한 경우 연습할 술기명과 필요한 물품을 상세히 작성해주세요.</strong>}
        </p>
        <textarea 
          placeholder="예: 청진기 1개 추가 요청합니다. 도뇨 연습용 거즈 여분 요청합니다."
          value={additionalRequest}
          onChange={(e) => setAdditionalRequest(e.target.value)}
          style={{ width: '100%', height: '100px', resize: 'none', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
        />
      </section>

      {/* 7. Notice Confirmation */}
      <section style={{ backgroundColor: '#fff9db', padding: '24px', borderRadius: '8px', border: '1px solid #ffe066' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="notice-confirm" 
            checked={confirmedNotice} 
            onChange={(e) => setConfirmedNotice(e.target.checked)}
            style={{ marginTop: '4px', width: '20px', height: '20px' }}
          />
          <label htmlFor="notice-confirm" style={{ fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
            OPEN LAB 이용 안내 및 유의사항을 확인했습니다. (필수)
          </label>
        </div>
        <div style={{ marginTop: '12px', marginLeft: '32px' }}>
          <Link href="/notices" target="_blank" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'underline' }}>
            OPEN LAB 이용 안내 보기
          </Link>
        </div>
      </section>

      <div style={{ textAlign: 'center' }}>
        <button 
          type="submit" 
          disabled={loading || !confirmedNotice || !!(capacityInfo && capacityInfo.remaining <= 0)}
          className="btn-accent" 
          style={{ width: '100%', padding: '18px', fontSize: '1.125rem' }}
        >
          {loading ? '신청 처리 중...' : (capacityInfo && capacityInfo.remaining <= 0) ? '신청 마감' : '사용 신청서 제출'}
        </button>
        {!confirmedNotice && (
          <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '8px' }}>
            * 이용 안내 확인 체크박스를 선택해주세요.
          </p>
        )}
      </div>
    </form>
  );
}
