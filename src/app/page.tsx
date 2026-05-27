import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HomeHistory from './HomeHistory';
import AdminQuickStats from '@/components/AdminQuickStats';

export default async function Home() {
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
              한양대학교 간호대학 OPEN LAB 신청서 작성
            </h2>

            <Link href="/open-lab" className="btn-accent">
              신청서 작성하기
            </Link>

            <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>
              * 로그인 없이 즉시 신청서 작성이 가능합니다. (로그인 시 작성 기록이 저장됩니다.)
            </p>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* My Recent History (Client Component) */}
            <section>
              <h3 className="section-title">
                <span>최근 내 신청서 작성 내역</span>
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
              <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '8px', fontSize: '0.9375rem' }}>NUR위한 (OPEN LAB 신청서 작성 도우미)</p>
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
