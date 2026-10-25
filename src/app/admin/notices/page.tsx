import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import NoticeManager from './NoticeManager';

export const dynamic = 'force-dynamic';

export default async function AdminNoticesPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text)' }}>공지 관리</h1>
        <NoticeManager
          initial={notices.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            isPinned: n.isPinned,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
