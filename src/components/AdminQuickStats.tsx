import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { assignmentNeedsUpdate } from '@/lib/clinical';
import Link from 'next/link';

// 관리자에게만 보이는 홈 상단 알림: 처리할 일이 있을 때만 눈에 띄게
export default async function AdminQuickStats() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return null;

  const [pendingUsers, needsUpdate] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'PENDING' } }).catch(() => 0),
    assignmentNeedsUpdate(),
  ]);

  const todos = [
    pendingUsers > 0 && { href: '/admin/users?tab=pending', text: `가입 승인 대기 ${pendingUsers}명` },
    needsUpdate && { href: '/admin/clinical-assignments', text: '임상실습 배정표를 새 학기로 업데이트해 주세요' },
  ].filter(Boolean) as { href: string; text: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {todos.map(t => (
        <Link
          key={t.href}
          href={t.href}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #FECACA',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            fontWeight: 700,
            fontSize: '0.9375rem',
          }}
        >
          <span>{t.text}</span>
          <span style={{ whiteSpace: 'nowrap' }}>처리하기 →</span>
        </Link>
      ))}
      <Link href="/admin" style={{ alignSelf: 'flex-end', fontSize: '0.8125rem', color: 'var(--sub-text)', fontWeight: 600 }}>
        관리자 페이지 →
      </Link>
    </div>
  );
}
