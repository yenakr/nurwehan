'use client';

import { useState } from 'react';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';

interface CareerClientProps {
  careerInfos: any[];
  user: any;
}

export default function CareerClient({ careerInfos, user }: CareerClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: '전체' },
    { key: 'LANGUAGE', label: '어학 성적' },
    { key: 'HOSPITAL', label: '병원 채용 일정' },
    { key: 'INTERNSHIP', label: '인턴십 및 병원 프로그램' },
    { key: 'APTITUDE', label: '적성검사 및 면접' },
    { key: 'NCLEX', label: '국가고시' },
  ];

  const filteredInfos = careerInfos.filter(info => {
    if (selectedCategory !== 'all' && info.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
          💼 취업 준비
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
          어학 성적 유효기간 관리부터 주요 병원 채용 일정, 자기소개서, 면접 및 국가고시 대비 흐름을 안내합니다.
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
            취업 및 진로 준비 가이드
          </h3>
          <PreparingBadge variant="badge" text="준비 중" />
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            color: 'var(--sub-text)',
          }}
        >
          <strong>공식 데이터 안내:</strong> 병원별 채용 일정, 지원요건, 어학 성적 인정 유효기간 및 국시 일정은 매년 공식 발표 후 관리자가 등록할 예정입니다.
        </div>

        {filteredInfos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredInfos.map(info => (
              <div key={info.id} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#334155' }}>
                    {info.category}
                  </span>
                  <PreparingBadge variant="badge" size="sm" text="준비 중" />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{info.title}</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--sub-text)' }}>{info.description || '상세 일정 및 요건 데이터 준비 중'}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="preparing"
            title="취업 및 채용 일정 정보 준비 중"
            description="현재 병원별 공식 채용 및 자격 요건 데이터를 준비 중입니다."
          />
        )}
      </div>
    </div>
  );
}
