import Calculator from './Calculator';

export const metadata = { title: '계산기' };

export default function ToolsPage() {
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: '560px' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>계산기</h1>
        <Calculator />
      </div>
    </main>
  );
}
