import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';


export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const notice = await prisma.notice.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  if (!notice) {
    return (
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>공지사항을 찾을 수 없습니다.</h1>
            <p style={{ color: 'var(--sub-text)', marginBottom: '32px' }}>존재하지 않거나 삭제된 공지사항입니다.</p>
            <Link href="/notices" className="btn-outline">목록으로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {notice.isPinned && <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>고정</span>}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px', lineHeight: '1.3' }}>
              {notice.title}
            </h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--sub-text)', fontSize: '0.875rem' }}>
              <span>작성자: {notice.user.name || '행정팀'}</span>
              <span>작성일: {new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div style={{ 
            fontSize: '1rem', 
            lineHeight: '1.8', 
            color: 'var(--text)', 
            whiteSpace: 'pre-wrap',
            minHeight: '200px'
          }}>
            {notice.content}
          </div>

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
            <Link href="/notices" className="btn-outline" style={{ padding: '10px 32px' }}>목록으로</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
