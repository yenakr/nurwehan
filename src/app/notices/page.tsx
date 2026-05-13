import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
        <div className="card">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
            공지사항
          </h1>
          
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--muted-background)', borderTop: '2px solid var(--text)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', width: '60px' }}>번호</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem' }}>제목</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', width: '100px' }}>작성자</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', width: '120px' }}>작성일</th>
                </tr>
              </thead>
              <tbody>
                {notices.length > 0 ? notices.map((n, index) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: n.isPinned ? '#f8faff' : 'transparent' }}>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>
                      {n.isPinned ? <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>공지</span> : notices.length - index}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>
                      <Link href={`/notices/${n.id}`} style={{ fontWeight: n.isPinned ? '700' : '500', color: 'var(--text)' }}>
                        {n.title}
                      </Link>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--sub-text)' }}>
                      {n.user.name || '행정팀'}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--sub-text)' }}>
                      {new Date(n.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--sub-text)' }}>
                      등록된 공지사항이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button className="btn-outline" style={{ padding: '4px 10px' }}>1</button>
          </div>
        </div>
      </div>
    </main>
  );
}
