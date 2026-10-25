'use client';

import Link from 'next/link';
import PlacementBox, { pickPlacement, type Placement } from './PlacementBox';
import HomeTiles, { type HomeTilesData } from './HomeTiles';

interface HomeDashboardClientProps {
  user: any;
  publishedEvents: any[];
  notices: any[];
  placements?: Placement[];
  tiles: HomeTilesData;
}

export default function HomeDashboardClient({
  user,
  publishedEvents,
  notices,
  placements = [],
  tiles,
}: HomeDashboardClientProps) {
  const nowDate = new Date();
  const dateParts = {
    ymd: nowDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    wd: nowDate.toLocaleDateString('ko-KR', { weekday: 'short' }),
  };
  const todayStr = `${dateParts.ymd} (${dateParts.wd})`;

  // 로그인한 학년의 일정(+공통 일정)만. 학년 정보가 없으면 전체를 보여준다.
  const gradeEvents = publishedEvents.filter(e => {
    if (e.isCommon || !user?.grade) return true;
    return e.applicableGrades?.includes(user.grade);
  });

  const now = new Date();
  const futureEvents = gradeEvents
    .filter(e => new Date(e.startDateTime) >= now)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const nearestEvent = futureEvents[0];
  let dDayText = '';
  if (nearestEvent) {
    const diffTime = new Date(nearestEvent.startDateTime).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    dDayText = diffDays === 0 ? 'D-Day' : `D-${diffDays}`;
  }

  const showPlacement = !!pickPlacement(placements, new Date());

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
              {todayStr}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
              {user ? `${user.name}님, 안녕하세요` : 'NUR위한'}
            </h1>
          </div>

        </div>

        {/* 실습 기간: 내 배정 / 그 외: 가장 가까운 주요 일정 */}
        {showPlacement ? (
          <PlacementBox placements={placements} />
        ) : (
        <div style={{ marginTop: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '14px 16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85, marginBottom: '6px' }}>가장 가까운 주요 일정</div>
          {nearestEvent ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px' }}>
              <div>
                <div style={{ fontSize: '1.0625rem', fontWeight: 800 }}>
                  {nearestEvent.title}
                  <span style={{ marginLeft: '8px', fontSize: '0.8125rem', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#0E4A84', padding: '2px 8px', borderRadius: '999px' }}>
                    {dDayText}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '2px' }}>
                  {new Date(nearestEvent.startDateTime).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                </div>
              </div>
              <Link href="/calendar" style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'underline' }}>
                캘린더 →
              </Link>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>예정된 일정이 없어요.</div>
          )}
        </div>
        )}
      </div>

      <HomeTiles data={tiles} />

      {/* Important Notices */}
      {notices && notices.length > 0 && (
        <section>
          <div className="section-title">
            <span>공지</span>
            <Link href="/notices" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)' }}>
              전체 →
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
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{n.title}</span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
