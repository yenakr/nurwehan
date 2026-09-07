import Link from 'next/link';

export default function ToolsPage() {
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '32px 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
            🛠️ NUR Tools (간호대 학생 지원 유틸리티 도구 모음)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>
            OPEN LAB 실습 신청서 자동작성처럼 학생들의 번거로운 작성 업무와 준비를 도와주는 유틸리티 모음입니다.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Tool 1: Existing OPEN LAB Form Auto Generator */}
          <div className="card">
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧪</div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              OPEN LAB 실습 신청서 작성기
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
              실습시간, 핵심간호술기 선택에 따른 기자재 수량 자동 계산 및 공식 신청서 인쇄/PDF 양식 생성
            </p>
            <Link href="/open-lab" className="btn-accent" style={{ fontSize: '0.84rem' }}>
              바로가기 →
            </Link>
          </div>

          {/* Tool 2: New Undergraduate / Lab Research Application Helper */}
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔬</div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
              연구실 OPEN LAB / 학부연구생 지원서 작성 도우미
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--sub-text)', marginBottom: '16px' }}>
              관심 연구분야, 지원동기, 관련 경험 및 배우고 싶은 내용을 정돈된 공식 지원서 템플릿으로 생성해 줍니다.
            </p>
            <Link href="/tools/lab-apply-helper" className="btn-primary" style={{ fontSize: '0.84rem' }}>
              작성 도우미 실행 →
            </Link>
          </div>

          {/* Future Tool Placeholder 1 */}
          <div className="card" style={{ backgroundColor: '#F8FAFC', opacity: 0.8 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✉️</div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--sub-text)', marginBottom: '6px' }}>
              교수님 문의 메일 작성 도우미 (확장 준비 중)
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', marginBottom: '16px' }}>
              면담 신청, 연구실 문의, 과제 관련 문의 이메일 정중한 양식 템플릿 생성기
            </p>
            <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#64748B' }}>
              준비 중
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
