import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminNoticesPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } }
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>공지사항 관리</h1>
          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>새 공지 작성</button>
        </div>
        
        <div className="card table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>구분</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>제목</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>작성자</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>작성일</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {notices.map(notice => (
                <tr key={notice.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>
                    {notice.isPinned ? <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>고정</span> : '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: '500' }}>{notice.title}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{notice.user.name}</td>
                  <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>수정</button>
                      <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
