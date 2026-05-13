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
    todayApprovedApps,
    missingLogsCount,
    restrictedStudents
  ] = await Promise.all([
    prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.application.count({ 
      where: { 
        status: { in: ['APPROVED', 'COMPLETED'] },
        slot: { date: { gte: startOfToday, lte: endOfToday } }
      } 
    }),
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
        <Link href="/admin/users" className="stat-card">
          <div className="stat-label">가입 신청 대기</div>
          <div className="stat-value">{pendingUsers}<span>건</span></div>
        </Link>
        
        <Link href="/admin/applications" className="stat-card">
          <div className="stat-label">OPEN LAB 신청 대기</div>
          <div className="stat-value">{pendingApps}<span>건</span></div>
        </Link>
        
        <Link href="/admin/attendance" className="stat-card">
          <div className="stat-label">오늘 승인된 OPEN LAB</div>
          <div className="stat-value">{todayApprovedApps}<span>건</span></div>
        </Link>
        
        <Link href="/admin/usage-logs" className="stat-card">
          <div className="stat-label">사용일지 미제출</div>
          <div className="stat-value" style={{ color: missingLogsCount > 0 ? '#ef4444' : 'inherit' }}>
            {missingLogsCount}<span>건</span>
          </div>
        </Link>
        
        <Link href="/admin/restrictions" className="stat-card">
          <div className="stat-label">신청 제한 학생</div>
          <div className="stat-value">{restrictedStudents}<span>명</span></div>
        </Link>
      </div>

      <style jsx>{`
        .stat-card {
          background: white;
          border: 1px solid var(--border);
          padding: 20px;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .stat-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .stat-label {
          font-size: 0.8125rem;
          color: var(--sub-text);
          font-weight: 500;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
        }
        .stat-value span {
          font-size: 0.875rem;
          margin-left: 4px;
          font-weight: 500;
          color: var(--sub-text);
        }
      `}</style>
    </div>
  );
}
