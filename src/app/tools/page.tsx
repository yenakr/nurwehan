import Link from 'next/link';

export default function ToolsPage() {
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>유틸리티</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              OPEN LAB 신청서 작성기
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
              기자재 수량 자동 계산, 신청서 인쇄/PDF 생성
            </p>
            <Link href="/open-lab" className="btn-accent" style={{ fontSize: '0.84rem' }}>
              바로가기 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
