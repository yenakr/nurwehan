import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import Link from 'next/link';

export default async function AdminQuickStats() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return null;

  const [pendingUsers, pendingApps] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.application.count({ where: { status: 'PENDING' } })
  ]);

  if (pendingUsers === 0 && pendingApps === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: '8px',
      padding: '16px 24px',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        <span style={{ fontWeight: '700', color: '#92400e' }}>관리자 알림</span>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        {pendingUsers > 0 && (
          <Link href="/admin/users" style={{ 
            fontSize: '0.9375rem', 
            color: '#b45309',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            • 가입 신청 대기 <strong style={{ fontSize: '1.0625rem' }}>{pendingUsers}</strong>건
          </Link>
        )}
        {pendingApps > 0 && (
          <Link href="/admin/applications" style={{ 
            fontSize: '0.9375rem', 
            color: '#b45309',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            • 오픈랩 신청 대기 <strong style={{ fontSize: '1.0625rem' }}>{pendingApps}</strong>건
          </Link>
        )}
      </div>

      <Link href="/admin" style={{ fontSize: '0.8125rem', color: '#d97706', fontWeight: '600' }}>
        관리자 페이지 바로가기 →
      </Link>
    </div>
  );
}
