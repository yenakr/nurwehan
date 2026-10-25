import { prisma } from '@/lib/prisma';
import Link from 'next/link';


export default async function NoticesPage() {
  const notices = await prisma.notice.findMany({
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>공지</h1>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {notices.length > 0 ? notices.map((n, index) => (
            <Link
              key={n.id}
              href={`/notices/${n.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderTop: index === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <span style={{ fontWeight: n.isPinned ? 800 : 600, color: 'var(--text)', fontSize: '0.9375rem' }}>
                {n.isPinned && <span style={{ color: 'var(--primary)', marginRight: '6px' }}>고정</span>}
                {n.title}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', whiteSpace: 'nowrap' }}>
                {new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
              </span>
            </Link>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--sub-text)' }}>공지가 없어요.</div>
          )}
        </div>
      </div>
    </main>
  );
}
