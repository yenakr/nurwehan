'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AdminRoadmapClientProps {
  initialItems: any[];
}

export default function AdminRoadmapClient({ initialItems }: AdminRoadmapClientProps) {
  const [items, setItems] = useState(initialItems);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('대학생활/학업');
  const [recommendedGrade, setRecommendedGrade] = useState(1);
  const [recommendedSemester, setRecommendedSemester] = useState<number | ''>('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [submitting, setSubmitting] = useState(false);

  const refreshItems = async () => {
    const res = await fetch('/api/admin/roadmap');
    const data = await res.json();
    if (data.items) setItems(data.items);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          recommendedGrade,
          recommendedSemester: recommendedSemester || null,
          status,
        }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setIsAdding(false);
        refreshItems();
      } else {
        alert('저장 실패');
      }
    } catch {
      alert('오류 발생');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item: any) => {
    const newStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await fetch('/api/admin/roadmap', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status: newStatus }),
    });
    refreshItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/roadmap?id=${id}`, { method: 'DELETE' });
    refreshItems();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              🧭 관리자 로드맵 (MY ROADMAP) 관리
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              1~4학년별 추천 학업, 실습, 어학, 취업 로드맵 가이드 항목을 추가 및 Draft/Publish 상태로 관리합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" className="btn-outline" style={{ fontSize: '0.84rem' }}>
              ← 관리자 메인
            </Link>
            <button onClick={() => setIsAdding(!isAdding)} className="btn-primary" style={{ fontSize: '0.84rem' }}>
              {isAdding ? '닫기' : '+ 새 로드맵 항목 추가'}
            </button>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>새 로드맵 가이드 항목 추가</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>제목 *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 2학년 핵심간호술기 연습 시작" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>카테고리</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }}>
                  <option value="대학생활/학업">대학생활/학업</option>
                  <option value="OPEN LAB/술기">OPEN LAB/술기</option>
                  <option value="임상실습/건강요건">임상실습/건강요건</option>
                  <option value="어학/취업">어학/취업</option>
                  <option value="비교과/연구">비교과/연구</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>권장 학년 *</label>
                <select value={recommendedGrade} onChange={e => setRecommendedGrade(Number(e.target.value))} style={{ width: '100%' }}>
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                  <option value={4}>4학년</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>게시 상태</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="PUBLISHED">공개 (PUBLISHED)</option>
                  <option value="DRAFT">임시저장 (DRAFT - 비노출)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>설명</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="학생들에게 노출될 상세 가이드 설명" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsAdding(false)} className="btn-outline">취소</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? '저장 중...' : '저장'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="card">
        <h3 className="section-title">
          <span>📋 등록된 로드맵 항목 ({items.length}개)</span>
        </h3>

        {items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>학년</th>
                  <th>카테고리</th>
                  <th>제목</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 800 }}>{item.recommendedGrade}학년</td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 700 }}>{item.title}</td>
                    <td>
                      <button
                        onClick={() => toggleStatus(item)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: item.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                          color: item.status === 'PUBLISHED' ? '#166534' : '#92400E',
                          cursor: 'pointer',
                        }}
                      >
                        {item.status === 'PUBLISHED' ? '공개 (PUBLISHED)' : '임시저장 (DRAFT)'}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item.id)} style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
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
            등록된 로드맵 가이드 항목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
