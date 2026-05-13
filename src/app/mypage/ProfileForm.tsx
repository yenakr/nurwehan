'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  user: {
    id: string;
    name: string;
    studentId: string;
    grade: number | null;
    email: string | null;
    phone: string | null;
    approvalStatus: string;
  };
}

export default function ProfileForm({ user }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    grade: user.grade || 1,
    phone: user.phone || '',
    email: user.email || '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('정보가 수정되었습니다.');
        setIsEditing(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || '수정 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('서버와의 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>기본 정보</h2>
        {!isEditing ? (
          <button className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.8125rem' }} onClick={() => setIsEditing(true)}>
            정보 수정
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8125rem' }} onClick={handleSave} disabled={loading}>
              저장
            </button>
            <button className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.8125rem' }} onClick={() => setIsEditing(false)} disabled={loading}>
              취소
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>이름</label>
          <div style={{ fontWeight: '600', padding: '8px 0' }}>{user.name}</div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>학번</label>
          <div style={{ fontWeight: '600', padding: '8px 0' }}>{user.studentId}</div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>학년</label>
          {isEditing ? (
            <select 
              value={formData.grade} 
              onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
            >
              {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g}학년</option>)}
            </select>
          ) : (
            <div style={{ fontWeight: '600', padding: '8px 0' }}>{user.grade}학년</div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>연락처</label>
          {isEditing ? (
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-0000-0000"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          ) : (
            <div style={{ fontWeight: '600', padding: '8px 0' }}>{user.phone || '-'}</div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>이메일</label>
          {isEditing ? (
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@hanyang.ac.kr"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          ) : (
            <div style={{ fontWeight: '600', padding: '8px 0' }}>{user.email || '-'}</div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--sub-text)', marginBottom: '4px' }}>계정 상태</label>
          <div style={{ fontWeight: '600', padding: '8px 0', color: user.approvalStatus === 'APPROVED' ? 'var(--primary)' : '#f59e0b' }}>
            {user.approvalStatus === 'APPROVED' ? '승인완료' : '승인대기'}
          </div>
        </div>
      </div>
    </section>
  );
}
