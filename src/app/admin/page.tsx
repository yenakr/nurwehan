import Header from '@/components/Header';

export default function AdminPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container">
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
              관리자 메뉴
            </h1>
            <p style={{ color: 'var(--sub-text)' }}>관리자 전용 페이지입니다. 접근 권한이 필요합니다.</p>
          </div>
        </div>
      </main>
    </>
  );
}
