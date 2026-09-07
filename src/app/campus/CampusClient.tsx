'use client';

import { useState } from 'react';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

interface CampusClientProps {
  campusActivities: any[];
  user: any;
}

export default function CampusClient({ campusActivities, user }: CampusClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: '전체' },
    { key: 'RESEARCH_LAB', label: '연구실 Open Lab' },
    { key: 'UNDERGRAD_RESEARCH', label: '학부연구생' },
    { key: 'SCHOLARSHIP', label: '장학금' },
    { key: 'COMPETITION', label: '학술대회 및 공모전' },
    { key: 'VOLUNTEER', label: '봉사 및 국제 프로그램' },
  ];

  const filteredActivities = campusActivities.filter(act => {
    if (selectedCategory !== 'all' && act.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            🏛️ 학부연구 & 비교과
          </h2>
          <Link href="/tools/lab-apply-helper" className="btn-accent" style={{ fontSize: '0.84rem' }}>
            ✏️ 연구실 지원서 작성 도우미 →
          </Link>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
          간호대학 연구실 탐색, 학부연구생 모집, 학술대회, 장학금 및 봉사 활동을 확인하세요.
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={selectedCategory === cat.key ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)' }}>
            비교과 및 학술 연구 활동 모집
          </h3>
          <PreparingBadge variant="badge" text="준비 중" />
        </div>

        {filteredActivities.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredActivities.map(act => (
              <div key={act.id} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#334155' }}>
                    {act.category}
                  </span>
                  <PreparingBadge variant="badge" size="sm" text="준비 중" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{act.title}</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--sub-text)' }}>{act.description || '준비 중'}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState type="preparing" />
        )}
      </div>
    </div>
  );
}
