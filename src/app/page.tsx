import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import HomeDashboardClient from './HomeDashboardClient';
import AdminQuickStats from '@/components/AdminQuickStats';
import HomeHistory from './HomeHistory';

export default async function Home() {
  const user = await getCurrentUser();

  const [publishedEvents, notices, placements] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { startDateTime: 'asc' },
    }).catch(() => []),
    prisma.notice.findMany({
      take: 5,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    }).catch(() => []),
    // 내 임상실습 배정 (이름 매칭). 테이블이 없거나 비어 있어도 홈은 정상 동작.
    user?.name
      ? prisma.clinicalAssignment.findMany({
          where: { name: user.name },
          orderBy: { weekNo: 'asc' },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <>
      <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <AdminQuickStats />

          {/* Core Interactive HOME Dashboard */}
          <HomeDashboardClient
            user={user}
            publishedEvents={publishedEvents}
            notices={notices}
            placements={placements}
          />

          {/* Preserved OPEN LAB Recent Applications Section */}
          <section style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <h3 className="section-title">
              <span>최근 내 OPEN LAB 신청 내역</span>
            </h3>
            <div className="card">
              <HomeHistory />
            </div>
          </section>
        </div>
      </main>

      <footer
        style={{
          backgroundColor: 'var(--muted-background)',
          borderTop: '1px solid var(--border)',
          padding: '40px 0',
          color: 'var(--sub-text)',
          fontSize: '0.8125rem',
          marginTop: 'auto',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '24px',
            }}
          >
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px', fontSize: '0.9375rem' }}>
                NUR위한
              </p>
              <p>한양대학교 간호대학 · © 2026</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontWeight: 500 }}>
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
