'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  application: any;
  user: any;
}

export default function UsageLogForm({ application, user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    practiceContent: '',
    difficulty: '',
    nextPracticeGoal: '',
    actualUsedSupplies: '',
    cleanupChecked: false,
    wasteChecked: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.practiceContent.trim()) return alert('실습 내용을 입력해주세요.');
    if (!formData.cleanupChecked || !formData.wasteChecked) {
      return alert('정리 상태 및 폐기물 분리배출 확인이 필요합니다.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/usage-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          ...formData
        })
      });

      if (res.ok) {
        alert('사용일지가 제출되었습니다.');
        router.push('/history');
      } else {
        const error = await res.json();
        alert(error.message || '제출에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const supplies = application.skills.flatMap((as: any) => as.skill.supplies);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Application Info Summary */}
      <div className="card" style={{ backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>신청 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.875rem' }}>
          <div>
            <label style={{ color: 'var(--sub-text)', display: 'block', marginBottom: '4px' }}>사용 일시</label>
            <div style={{ fontWeight: '600' }}>{new Date(application.slot.date).toLocaleDateString()} {application.slot.startTime} ~ {application.slot.endTime}</div>
          </div>
          <div>
            <label style={{ color: 'var(--sub-text)', display: 'block', marginBottom: '4px' }}>실습실</label>
            <div style={{ fontWeight: '600' }}>{application.slot.room}</div>
          </div>
          <div>
            <label style={{ color: 'var(--sub-text)', display: 'block', marginBottom: '4px' }}>대표 신청자</label>
            <div style={{ fontWeight: '600' }}>{application.representativeUser.name}</div>
          </div>
          <div>
            <label style={{ color: 'var(--sub-text)', display: 'block', marginBottom: '4px' }}>참여 인원</label>
            <div style={{ fontWeight: '600' }}>{application.participants.map((p: any) => p.name).join(', ')}</div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>1. 실습 내용 (필수)</label>
          <textarea 
            value={formData.practiceContent}
            onChange={(e) => setFormData(prev => ({ ...prev, practiceContent: e.target.value }))}
            placeholder="연습한 술기와 주요 내용을 작성해주세요."
            style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>2. 연습하면서 어려웠던 점 (선택)</label>
          <textarea 
            value={formData.difficulty}
            onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
            placeholder="술기 수행 중 어려웠던 점이나 해결이 안 된 부분이 있다면 작성해주세요."
            style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>3. 다음에 더 연습하고 싶은 부분 (선택)</label>
          <input 
            type="text"
            value={formData.nextPracticeGoal}
            onChange={(e) => setFormData(prev => ({ ...prev, nextPracticeGoal: e.target.value }))}
            placeholder="다음 연습 시 목표로 하는 부분을 작성해주세요."
            style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>4. 실제 사용한 물품 (선택)</label>
          <div style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '12px' }}>
            기본 제공된 물품 외에 추가로 사용한 소모품이 있다면 작성해주세요.
          </div>
          <textarea 
            value={formData.actualUsedSupplies}
            onChange={(e) => setFormData(prev => ({ ...prev, actualUsedSupplies: e.target.value }))}
            placeholder="예: 거즈 4x4 2장, 알코올 솜 3개 등"
            style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>최종 정리 및 폐기물 확인</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={formData.cleanupChecked}
              onChange={(e) => setFormData(prev => ({ ...prev, cleanupChecked: e.target.checked }))}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>실습실 정리를 모두 마쳤습니다. (주변 정리 및 물품 반납)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={formData.wasteChecked}
              onChange={(e) => setFormData(prev => ({ ...prev, wasteChecked: e.target.checked }))}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>일반의료폐기물/손상성폐기물을 올바르게 분리배출했습니다.</span>
          </label>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || !formData.practiceContent.trim() || !formData.cleanupChecked || !formData.wasteChecked}
        className="btn-accent" 
        style={{ width: '100%', padding: '18px', fontSize: '1.125rem' }}
      >
        {loading ? '제출 중...' : '사용일지 제출하기'}
      </button>
    </form>
  );
}
