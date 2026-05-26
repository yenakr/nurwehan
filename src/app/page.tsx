import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HomeHistory from './HomeHistory';
import AdminQuickStats from '@/components/AdminQuickStats';

export default async function Home() {
  // Fetch official notice - This is static/shared data, safe for server render
  const notice = await prisma.notice.findUnique({
    where: { id: 'official-guide' }
  });

  return (
    <>
      <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '40px 0' }}>
        <div className="container">
          <AdminQuickStats />

          {/* Hero / Application Section */}
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'var(--muted-background)',
            borderRadius: '8px',
            marginBottom: '48px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>
              한양대학교 간호대학 OPEN LAB 신청
            </h2>

            <Link href="/open-lab" className="btn-accent">
              OPEN LAB 신청하기
            </Link>

            <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              * 로그인 없이도 즉시 신청서를 생성하고 PDF로 인쇄/다운로드할 수 있습니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

            {/* Notice Section */}
            <section>
              <h3 className="section-title">
                <span>OPEN LAB 이용 안내</span>
              </h3>
              <div className="card" style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text)' }}>
                {notice ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>한 타임에 최대 2가지 술기까지 신청 가능합니다.</li>
                      <li>학생 1명당 주 1회 신청 가능합니다.</li>
                      <li>불참 또는 30분 이상 지각 시 2주간 신청이 제한됩니다.</li>
                    </ul>
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      color: 'var(--sub-text)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {notice.content.length > 150 ? notice.content.substring(0, 150) + '...' : notice.content}
                    </div>
                  </div>
                ) : (
                  <p>공지사항을 불러오는 중입니다...</p>
                )}
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <Link href="/notices" style={{ color: 'var(--primary)', fontWeight: '600' }}>전체 공지 보기 →</Link>
                </div>
              </div>
            </section>

            {/* My Recent History (Client Component) */}
            <section>
              <h3 className="section-title">
                <span>최근 내 신청 내역</span>
              </h3>
              <div className="card">
                <HomeHistory />
              </div>
            </section>

          </div>
        </div>
      </main>

      <footer style={{
        backgroundColor: 'var(--muted-background)',
        borderTop: '1px solid var(--border)',
        padding: '40px 0',
        color: 'var(--sub-text)',
        fontSize: '0.8125rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px' }}>
            <div>
              <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '8px', fontSize: '0.9375rem' }}>NUR위한 (OPEN LAB 신청 도우미)</p>
              <p>본 사이트는 간호대학 학생들의 편리한 실습실 및 기자재 신청서 작성을 돕기 위한 개별 유틸리티 서비스입니다.</p>
              <p>© 2026 NUR위한. All Rights Reserved.</p>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontWeight: '500' }}>
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
