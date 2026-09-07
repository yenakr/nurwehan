'use client';

import { useState } from 'react';
import Link from 'next/link';
import PreparingBadge from '@/components/PreparingBadge';
import EmptyState from '@/components/EmptyState';

interface HomeDashboardClientProps {
  user: any;
  publishedEvents: any[];
  publishedRoadmaps: any[];
  notices: any[];
}

export default function HomeDashboardClient({
  user,
  publishedEvents,
  publishedRoadmaps,
  notices,
}: HomeDashboardClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<number>(user?.grade || 3); // Default 3rd grade if guest
  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  // Filter events targeted for selected grade
  const gradeEvents = publishedEvents.filter(e => {
    if (e.isCommon) return true;
    return e.applicableGrades?.includes(selectedGrade);
  });

  // Find nearest event with valid date
  const now = new Date();
  const futureEvents = gradeEvents
    .filter(e => new Date(e.startDateTime) >= now)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const nearestEvent = futureEvents[0];
  let dDayText = '준비 중';
  if (nearestEvent) {
    const diffTime = new Date(nearestEvent.startDateTime).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    dDayText = diffDays === 0 ? 'D-Day' : `D-${diffDays}`;
  }

  // Filter roadmap items for selected grade
  const gradeRoadmaps = publishedRoadmaps.filter(r => r.recommendedGrade === selectedGrade);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Banner / Hero Context */}
      <div
        style={{
          backgroundColor: '#0E4A84',
          color: '#FFFFFF',
          borderRadius: '12px',
          padding: '28px 24px',
          boxShadow: '0 4px 12px rgba(14, 74, 132, 0.15)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: '6px' }}>
              📅 오늘은 {todayStr} 입니다
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
              {user ? `${user.name}님, 오늘 해야 할 학업·실습 일정을 확인하세요!` : '한양대학교 간호대학 통합 학업·실습·진로 로드맵'}
            </h1>
            <p style={{ fontSize: '0.9375rem', opacity: 0.9 }}>
              1학년부터 4학년까지의 학사일정, 임상실습, OPEN LAB, 취업 준비를 하나의 흐름으로 안내합니다.
            </p>
          </div>

          {/* Grade Selector */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '12px 16px',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              학년 선택
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    backgroundColor: selectedGrade === g ? '#FFFFFF' : 'transparent',
                    color: selectedGrade === g ? '#0E4A84' : '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Widget 1: Nearest Major Event D-Day */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
              🎯 가장 가까운 주요 일정
            </h3>
            {nearestEvent ? (
              <span className="badge btn-accent" style={{ color: '#FFFFFF', padding: '4px 10px' }}>
                {dDayText}
              </span>
            ) : (
              <PreparingBadge variant="badge" text="준비 중" />
            )}
          </div>

          {nearestEvent ? (
            <div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
                {nearestEvent.title}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '12px' }}>
                {new Date(nearestEvent.startDateTime).toLocaleDateString('ko-KR')}
                {nearestEvent.description && ` • ${nearestEvent.description}`}
              </p>
              <Link href="/calendar" className="btn-outline" style={{ fontSize: '0.8125rem', padding: '4px 10px' }}>
                캘린더 전체보기 →
              </Link>
            </div>
          ) : (
            <EmptyState
              type="preparing"
              title="등록된 가까운 주요 일정이 없습니다."
              description="관리자가 학사일정 및 실습 OT 일정을 게시 준비 중입니다."
            />
          )}
        </div>

        {/* Widget 2: OPEN LAB Quick Action */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--accent)',
            backgroundColor: '#F0F9FF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
              🧪 OPEN LAB 신청
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-hover)', backgroundColor: '#E0F2FE', padding: '2px 8px', borderRadius: '4px' }}>
              핵심간호술기
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '16px' }}>
            실습실 자율연습 슬롯 확인, 핵심간호술기 및 기자재 수량 자동 신청서를 즉시 작성할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/open-lab" className="btn-accent" style={{ flex: 1, textAlign: 'center' }}>
              신청서 작성하기
            </Link>
            <Link href="/history" className="btn-outline" style={{ flex: 1, textAlign: 'center' }}>
              내 신청 내역
            </Link>
          </div>
        </div>

        {/* Widget 3: Clinical Health Readiness Overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
              🩺 임상실습 건강요건 준비상태
            </h3>
            <PreparingBadge variant="badge" text="준비 중" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)', marginBottom: '12px' }}>
            예방접종(A/B형 간염, MMR, 수두) 및 결핵검사 등 세부 요구사항 기준을 준비 중입니다.
          </p>
          <Link href="/clinical" className="btn-outline" style={{ width: '100%', textAlign: 'center', fontSize: '0.84rem' }}>
            임상실습 준비가이드 확인 →
          </Link>
        </div>
      </div>

      {/* Recommended Activities for Current Grade */}
      <section>
        <div className="section-title">
          <span>🚩 {selectedGrade}학년 추천 학업·진로 로드맵</span>
          <Link href="/roadmap" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)' }}>
            전체 4년 로드맵 보기 →
          </Link>
        </div>

        {gradeRoadmaps.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {gradeRoadmaps.slice(0, 4).map(item => (
              <div key={item.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#334155' }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>
                    {item.recommendedSemester ? `${item.recommendedGrade}학년 ${item.recommendedSemester}학기` : `${item.recommendedGrade}학년`}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', lineHeight: 1.4 }}>
                  {item.description || '상세 가이드 준비 중'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="preparing"
            title={`${selectedGrade}학년 추천 항목을 준비 중입니다.`}
            description="관리자가 해당 학년의 로드맵 가이드 데이터를 등록 준비 중입니다."
          />
        )}
      </section>

      {/* Important Notices */}
      {notices && notices.length > 0 && (
        <section>
          <div className="section-title">
            <span>📢 주요 공지사항</span>
            <Link href="/notices" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)' }}>
              전체 공지 보기 →
            </Link>
          </div>
          <div className="card" style={{ padding: '0' }}>
            {notices.map((n, idx) => (
              <Link
                key={n.id}
                href={`/notices/${n.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: idx === notices.length - 1 ? 'none' : '1px solid var(--border)',
                  fontSize: '0.9375rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {n.isPinned && <span className="badge badge-pending">필독</span>}
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{n.title}</span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                  {new Date(n.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
