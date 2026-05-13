import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import Link from 'next/link';

export default async function AdminQuickStats() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    pendingUsers,
    pendingApps,
    missingLogsCount,
    restrictedStudents
  ] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.application.count({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        slot: { date: { lt: startOfToday } }, // Past applications
        usageLogs: { none: {} }
      }
    }),
    prisma.restriction.count({
      where: {
        isActive: true,
        endDate: { gte: now }
      }
    })
  ]);

  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text)' }}>관리 현황 요약</h3>
        <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '12px' }}>ADMIN</span>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '16px' 
      }}>
        {[
          { label: '가입 신청 대기', value: pendingUsers, unit: '건', href: '/admin/users' },
          { label: 'OPEN LAB 신청 대기', value: pendingApps, unit: '건', href: '/admin/applications' },
          { label: '소감 미제출', value: missingLogsCount, unit: '건', href: '/admin/usage-logs', urgent: missingLogsCount > 0 },
          { label: '신청 제한 학생', value: restrictedStudents, unit: '명', href: '/admin/restrictions' },
        ].map((stat, i) => (
          <Link 
            key={i}
            href={stat.href} 
            style={{
              background: 'white',
              border: '1px solid var(--border)',
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', fontWeight: 500 }}>{stat.label}</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              color: stat.urgent ? '#ef4444' : 'var(--primary)' 
            }}>
              {stat.value}<span style={{ fontSize: '0.875rem', marginLeft: '4px', fontWeight: 500, color: 'var(--sub-text)' }}>{stat.unit}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
