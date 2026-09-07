'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AdminCalendarClientProps {
  initialEvents: any[];
}

export default function AdminCalendarClient({ initialEvents }: AdminCalendarClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [category, setCategory] = useState('OFFICIAL');
  const [academicYear, setAcademicYear] = useState(2026);
  const [targetGrade, setTargetGrade] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [submitting, setSubmitting] = useState(false);

  const refreshEvents = async () => {
    const res = await fetch('/api/admin/calendar');
    const data = await res.json();
    if (data.events) setEvents(data.events);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDateTime) return;
    setSubmitting(true);
    try {
      const isCommon = targetGrade === 'all';
      const applicableGrades = isCommon ? [1, 2, 3, 4] : [Number(targetGrade)];

      const res = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          startDateTime,
          category,
          academicYear,
          applicableGrades,
          isCommon,
          status,
        }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setStartDateTime('');
        setIsAdding(false);
        refreshEvents();
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
    if (!confirm('일정을 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/calendar?id=${id}`, { method: 'DELETE' });
    refreshEvents();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              📅 캘린더 관리
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              학년별 학사일정, 중간/기말고사, 임상실습 OT, 학생회/공식행사 일정을 관리합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin" className="btn-outline" style={{ fontSize: '0.84rem' }}>
              ← 관리자 메인
            </Link>
            <button onClick={() => setIsAdding(!isAdding)} className="btn-primary" style={{ fontSize: '0.84rem' }}>
              {isAdding ? '닫기' : '+ 새 공식 일정 추가'}
            </button>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>새 공식 일정 등록</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>일정명 *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 3학년 임상실습 OT, 학생회 총회" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>날짜 *</label>
                <input type="date" required value={startDateTime} onChange={e => setStartDateTime(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>대상 학년</label>
                <select value={targetGrade} onChange={e => setTargetGrade(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="all">전체학년</option>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">4학년</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>카테고리</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }}>
                  <option value="OFFICIAL">공식 행사</option>
                  <option value="STUDENT_COUNCIL">학생회 행사</option>
                  <option value="ACADEMIC">수업/학업</option>
                  <option value="EXAM">시험</option>
                  <option value="CLINICAL">실습</option>
                  <option value="HEALTH">건강요건</option>
                  <option value="OPEN_LAB">OPEN LAB</option>
                  <option value="CAREER">취업/어학</option>
                  <option value="CAMPUS">연구/비교과</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>게시 상태</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="PUBLISHED">공개</option>
                  <option value="DRAFT">임시저장</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>상세 설명</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="일정 상세 설명" style={{ width: '100%' }} />
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
          <span>📋 등록된 학사 및 실습 일정 ({events.length}개)</span>
        </h3>

        {events.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>카테고리</th>
                  <th>일정명</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {new Date(e.startDateTime).toLocaleDateString('ko-KR')}
                    </td>
                    <td>{e.category}</td>
                    <td style={{ fontWeight: 700 }}>{e.title}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: e.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                          color: e.status === 'PUBLISHED' ? '#166534' : '#92400E',
                        }}
                      >
                        {e.status === 'PUBLISHED' ? '공개' : '임시저장'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(e.id)} style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
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
            등록된 공식 학사 및 실습 일정이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
