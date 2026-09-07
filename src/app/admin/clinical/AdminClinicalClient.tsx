'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AdminClinicalClientProps {
  initialRequirements: any[];
}

export default function AdminClinicalClient({ initialRequirements }: AdminClinicalClientProps) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('VACCINATION');
  const [studentDisplayText, setStudentDisplayText] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [submitting, setSubmitting] = useState(false);

  const refreshRequirements = async () => {
    const res = await fetch('/api/admin/clinical');
    const data = await res.json();
    if (data.requirements) setRequirements(data.requirements);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          studentDisplayText,
          description,
          status,
        }),
      });
      if (res.ok) {
        setName('');
        setStudentDisplayText('');
        setDescription('');
        setIsAdding(false);
        refreshRequirements();
      } else {
        alert('등록 실패');
      }
    } catch {
      alert('오류 발생');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 건강요건 항목을 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/clinical?id=${id}`, { method: 'DELETE' });
    refreshRequirements();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              🩺 관리자 임상실습 건강요건 (Health Requirements Rule Engine) 설정
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              예방접종(A/B형 간염, MMR, 수두) 및 결핵/항체검사 세부 요건과 판정 규칙을 등록합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" className="btn-outline" style={{ fontSize: '0.84rem' }}>
              ← 관리자 메인
            </Link>
            <button onClick={() => setIsAdding(!isAdding)} className="btn-primary" style={{ fontSize: '0.84rem' }}>
              {isAdding ? '닫기' : '+ 새 건강요건 항목 추가'}
            </button>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>새 건강요건 항목 등록</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>항목명 *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="예: A형 간염 예방접종 / 결핵 흉부X선" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>구분</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }}>
                  <option value="VACCINATION">예방접종 (VACCINATION)</option>
                  <option value="LAB_TEST">항체/혈액/결핵검사 (LAB_TEST)</option>
                  <option value="DOCUMENT">증빙서류 (DOCUMENT)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>게시 상태</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="PUBLISHED">공개 (PUBLISHED)</option>
                  <option value="DRAFT">임시저장 (DRAFT - 준비 중 비노출)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>학생 노출 설명 문구</label>
              <input type="text" value={studentDisplayText} onChange={e => setStudentDisplayText(e.target.value)} placeholder="예: 2차 접종 완료 증명서 제출 필요" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>관리자 메모 / 상세 설명</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="실습기관 요구사항 및 내부 가이드 메모" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsAdding(false)} className="btn-outline">취소</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? '저장 중...' : '저장'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">
          <span>📋 등록된 건강요건 항목 ({requirements.length}개)</span>
        </h3>

        {requirements.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>항목명</th>
                  <th>구분</th>
                  <th>학생 노출 안내</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700 }}>{req.name}</td>
                    <td>{req.category}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>{req.studentDisplayText || '-'}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: req.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                          color: req.status === 'PUBLISHED' ? '#166534' : '#92400E',
                        }}
                      >
                        {req.status === 'PUBLISHED' ? '공개' : '임시저장 (준비 중)'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(req.id)} style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--sub-text)' }}>
            등록된 건강요건 기준이 없습니다. (현재 학생 화면에는 "준비 중"으로 표시됩니다)
          </div>
        )}
      </div>
    </div>
  );
}
