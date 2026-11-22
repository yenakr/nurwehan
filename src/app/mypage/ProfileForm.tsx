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
  notice?: string | null;
}

export default function ProfileForm({ user, notice }: Props) {
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
      <div className="mp-hero">
        <div className="mp-av" aria-hidden="true">{user.name.slice(0, 1)}</div>
        <div className="mp-id">
          <div className="mp-who">
            <h2>{user.name}</h2>
            <span className={`mp-pill ${status.c}`}>{status.t}</span>
          </div>
          <div className="mp-sub">{user.studentId} · {user.grade ?? '-'}학년</div>
        </div>
        {!isEditing && <button className="mp-btn ghost" onClick={() => setIsEditing(true)}>수정</button>}
      </div>

      {notice && <div className="mp-note warn">{notice}</div>}
      {isRejected && !isEditing && (
        <div className="mp-note warn">거절 사유: {user.rejectedReason || '없음'}</div>
      )}

      <dl className="mp-rows">
        {lockedId && <div className="mp-row"><dt>이름</dt><dd>{input('name')}</dd></div>}
        {lockedId && <div className="mp-row"><dt>학번</dt><dd>{input('studentId')}</dd></div>}
        {isEditing && (
          <div className="mp-row"><dt>학년</dt><dd>
            <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}>
              {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </dd></div>
        )}
        <div className="mp-row"><dt>연락처</dt><dd>{isEditing ? input('phone', '010-0000-0000') : (user.phone || '-')}</dd></div>
        <div className="mp-row"><dt>이메일</dt><dd>{isEditing ? input('email', 'example@hanyang.ac.kr', 'email') : (user.email || '-')}</dd></div>
      </dl>

      {isEditing && (
        <div className="mp-acts">
          <button className="mp-btn" onClick={handleSave} disabled={loading}>{isRejected ? '저장 · 재신청' : '저장'}</button>
          <button className="mp-btn ghost" onClick={() => setIsEditing(false)} disabled={loading}>취소</button>
        </div>
      )}

      <style>{`
        .mp-card{background:var(--background);border:1px solid var(--border);border-radius:14px;padding:16px}
        .mp-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
        .mp-head h2{font-size:.9375rem;font-weight:700;margin:0}
        .mp-hero{display:flex;align-items:center;gap:12px}
        .mp-av{flex:0 0 auto;width:48px;height:48px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:1.25rem;font-weight:800}
        .mp-id{flex:1;min-width:0}
        .mp-who{display:flex;align-items:center;gap:8px}
        .mp-who h2{font-size:1.0625rem;font-weight:800;margin:0}
        .mp-sub{font-size:.8125rem;color:var(--sub-text);margin-top:2px}
        .mp-pill{font-size:.6875rem;font-weight:700;padding:2px 8px;border-radius:999px}
        .mp-pill.ok{background:rgba(16,185,129,.14);color:#059669}
        .mp-pill.no{background:rgba(239,68,68,.14);color:#dc2626}
        .mp-pill.wait{background:rgba(245,158,11,.16);color:#b9770e}
        .mp-btn{padding:6px 12px;font-size:.8125rem;font-weight:600;border-radius:8px;border:1px solid var(--primary);background:var(--primary);color:#fff;cursor:pointer;font-family:inherit}
        .mp-btn.ghost{background:transparent;color:var(--primary)}
        .mp-btn:disabled{opacity:.5}
        .mp-note{font-size:.8125rem;line-height:1.45;padding:8px 10px;border-radius:8px;margin-top:12px;background:rgba(245,158,11,.12);color:var(--text)}
        .mp-rows{margin:12px 0 0;padding-top:4px;border-top:1px solid var(--border)}
        .mp-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--border)}
        .mp-row:first-child{border-top:0}
        .mp-row dt{flex:0 0 52px;font-size:.8125rem;color:var(--sub-text)}
        .mp-row dd{flex:1;min-width:0;margin:0;font-size:.9375rem;font-weight:600;word-break:break-all;text-align:right}
        .mp-row input,.mp-row select{width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:.875rem;background:var(--background);color:var(--text);text-align:left;font-family:inherit}
        .mp-acts{display:flex;gap:6px;justify-content:flex-end;margin-top:6px}
      `}</style>
    </section>
  );
}
