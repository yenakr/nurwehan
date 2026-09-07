'use client';

import { useState } from 'react';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

interface RoadmapClientProps {
  initialItems: any[];
  user: any;
}

export default function RoadmapClient({ initialItems, user }: RoadmapClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>(user?.grade || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'my'>('timeline');

  const categories = ['all', '대학생활/학업', 'OPEN LAB/술기', '임상실습/건강요건', '어학/취업', '비교과/연구'];

  const filteredItems = initialItems.filter(item => {
    if (selectedGrade !== 'all' && item.recommendedGrade !== selectedGrade) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const grade1Items = filteredItems.filter(i => i.recommendedGrade === 1);
  const grade2Items = filteredItems.filter(i => i.recommendedGrade === 2);
  const grade3Items = filteredItems.filter(i => i.recommendedGrade === 3);
  const grade4Items = filteredItems.filter(i => i.recommendedGrade === 4);

  const renderGradeBlock = (gradeNum: number, items: any[], defaultSummary: string) => {
    return (
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--primary)',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '4px',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              {gradeNum}학년
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--sub-text)', fontWeight: 500 }}>
              {defaultSummary}
            </span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
            총 {items.length}개 항목
          </span>
        </div>

        {items.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '16px',
                  backgroundColor: 'var(--white)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                      {item.category}
                    </span>
                    {item.recommendedStartDate ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {new Date(item.recommendedStartDate).toLocaleDateString('ko-KR')}
                      </span>
                    ) : (
                      <PreparingBadge variant="badge" size="sm" text="준비 중" />
                    )}
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--sub-text)', marginBottom: '12px', lineHeight: 1.4 }}>
                    {item.description || '준비 중'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>
                    {item.isRequired ? '필수 항목' : '권장 항목'}
                  </span>
                  {item.relatedInternalUrl ? (
                    <Link href={item.relatedInternalUrl} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                      관련 기능으로 이동 →
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>상세 가이드</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState type="preparing" />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              MY ROADMAP
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              입학부터 졸업 및 병원 취업, 국가고시까지 흐름에 맞춰 무엇을 준비해야 하는지 확인하세요.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('timeline')}
              className={viewMode === 'timeline' ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '0.84rem' }}
            >
              전체 4년 로드맵
            </button>
            <button
              onClick={() => {
                setViewMode('my');
                if (user?.grade) setSelectedGrade(user.grade);
              }}
              className={viewMode === 'my' ? 'btn-accent' : 'btn-outline'}
              style={{ fontSize: '0.84rem' }}
            >
              지금 나에게 필요한 로드맵
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)' }}>학년:</span>
            {['all', 1, 2, 3, 4].map(g => (
              <button
                key={String(g)}
                onClick={() => setSelectedGrade(g as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8125rem',
                  fontWeight: selectedGrade === g ? 700 : 500,
                  backgroundColor: selectedGrade === g ? 'var(--primary)' : 'var(--muted-background)',
                  color: selectedGrade === g ? '#FFFFFF' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {g === 'all' ? '전체 학년' : `${g}학년`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--sub-text)' }}>카테고리:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.8125rem' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? '전체 카테고리' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Render Roadmap Blocks */}
      {(selectedGrade === 'all' || selectedGrade === 1) && renderGradeBlock(1, grade1Items, '대학생활 적응, 기초 전공 탐색, 동아리 및 비교과 활동')}
      {(selectedGrade === 'all' || selectedGrade === 2) && renderGradeBlock(2, grade2Items, '전공 기초 강화, 핵심간호술기 시작, OPEN LAB 활용, 어학 준비')}
      {(selectedGrade === 'all' || selectedGrade === 3) && renderGradeBlock(3, grade3Items, '임상실습 오리엔테이션 및 건강요건, 병원실습, 어학성적, 취업 준비')}
      {(selectedGrade === 'all' || selectedGrade === 4) && renderGradeBlock(4, grade4Items, '병원 채용 서류 및 면접, 국가고시 대비, 졸업 준비')}
    </div>
  );
}
