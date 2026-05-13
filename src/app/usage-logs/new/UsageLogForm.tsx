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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.practiceContent.trim()) return alert('실습 소감을 입력해주세요.');

    setLoading(true);
    try {
      const res = await fetch('/api/usage-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          practiceContent: formData.practiceContent,
          difficulty: formData.difficulty,
          nextPracticeGoal: '',
          actualUsedSupplies: '',
          cleanupChecked: true,
          wasteChecked: true
        })
      });

      if (res.ok) {
        alert('실습 소감이 제출되었습니다.');
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

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Application Info Summary */}
      <div className="card" style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
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
        </div>
      </div>

      {/* Input Section */}
      <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text)' }}>1. 실습 소감 (필수)</label>
          <textarea 
            value={formData.practiceContent}
            onChange={(e) => setFormData(prev => ({ ...prev, practiceContent: e.target.value }))}
            placeholder="오늘 실습을 통해 배우거나 느낀 점을 자유롭게 작성해주세요."
            style={{ width: '100%', height: '180px', padding: '16px', border: '2px solid #f1f5f9', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text)' }}>2. 기타 할말 (선택)</label>
          <textarea 
            value={formData.difficulty}
            onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
            placeholder="추가로 전달하고 싶은 내용이나 건의사항이 있다면 작성해주세요."
            style={{ width: '100%', height: '100px', padding: '16px', border: '2px solid #f1f5f9', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading || !formData.practiceContent.trim()}
        className="btn-accent" 
        style={{ width: '100%', padding: '20px', fontSize: '1.25rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
      >
        {loading ? '제출 중...' : '실습 소감 제출하기'}
      </button>
    </form>
  );
}
