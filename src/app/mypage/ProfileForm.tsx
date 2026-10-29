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
    rejectedReason?: string | null;
  };
}

export default function ProfileForm({ user }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    studentId: user.studentId,
    grade: user.grade || 1,
    phone: user.phone || '',
    email: user.email || '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(user.approvalStatus === 'REJECTED' ? '재확인을 요청했어요.' : '저장했어요.');
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

  const isApproved = user.approvalStatus === 'APPROVED';
  const isRejected = user.approvalStatus === 'REJECTED';

  const status = isApproved ? { t: '확인완료', c: 'ok' } : isRejected ? { t: '거절됨', c: 'no' } : { t: '확인대기', c: 'wait' };
  const input = (key: 'name' | 'studentId' | 'phone' | 'email', ph?: string, type = 'text') => (
    <input type={type} value={formData[key]} placeholder={ph}
      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
  );
  const lockedId = isEditing && !isApproved;

  return (
    <section className="mp-card">
      <div className="mp-head">
        <div className="mp-who">
          <h2>{user.name}</h2>
          <span className={`mp-pill ${status.c}`}>{status.t}</span>
        </div>
        {!isEditing ? (
          <button className="mp-btn ghost" onClick={() => setIsEditing(true)}>수정</button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="mp-btn" onClick={handleSave} disabled={loading}>{isRejected ? '저장 · 재신청' : '저장'}</button>
            <button className="mp-btn ghost" onClick={() => setIsEditing(false)} disabled={loading}>취소</button>
          </div>
        )}
      </div>

      {isRejected && !isEditing && (
        <div className="mp-note">
          거절 사유: {user.rejectedReason || '없음'} · 정보를 수정해 저장하면 재확인을 요청해요.
        </div>
      )}

      <dl className="mp-grid">
        <div><dt>이름</dt><dd>{lockedId ? input('name') : user.name}</dd></div>
        <div><dt>학번</dt><dd>{lockedId ? input('studentId') : user.studentId}</dd></div>
        <div><dt>학년</dt><dd>{isEditing ? (
          <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}>
            {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g}학년</option>)}
          </select>
        ) : `${user.grade ?? '-'}학년`}</dd></div>
        <div><dt>연락처</dt><dd>{isEditing ? input('phone', '010-0000-0000') : (user.phone || '-')}</dd></div>
        <div className="wide"><dt>이메일</dt><dd>{isEditing ? input('email', 'example@hanyang.ac.kr', 'email') : (user.email || '-')}</dd></div>
      </dl>

      <style>{`
        .mp-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px 16px}
        .mp-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
        .mp-head h2{font-size:1rem;font-weight:700;margin:0}
        .mp-who{display:flex;align-items:center;gap:8px}
        .mp-pill{font-size:.6875rem;font-weight:600;padding:2px 8px;border-radius:999px}
        .mp-pill.ok{background:#e8eefb;color:var(--primary)}
        .mp-pill.no{background:#fdecec;color:#c0392b}
        .mp-pill.wait{background:#fff4e0;color:#b9770e}
        .mp-btn{padding:6px 12px;font-size:.8125rem;font-weight:600;border-radius:8px;border:1px solid var(--primary);background:var(--primary);color:#fff;cursor:pointer}
        .mp-btn.ghost{background:#fff;color:var(--primary)}
        .mp-btn:disabled{opacity:.5}
        .mp-note{font-size:.8125rem;color:var(--sub-text);border-left:3px solid #e0a43a;padding:2px 0 2px 10px;margin:4px 0 10px;line-height:1.45}
        .mp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:0}
        .mp-grid .wide{grid-column:1/-1}
        .mp-grid dt{font-size:.75rem;color:var(--sub-text);margin-bottom:2px}
        .mp-grid dd{margin:0;font-size:.9375rem;font-weight:600;word-break:break-all}
        .mp-grid input,.mp-grid select{width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.875rem;background:#fff}
      `}</style>
    </section>
  );
}
