import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminApplicationsPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      representativeUser: true,
      slot: true,
      skills: { include: { skill: true } }
    }
  });

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
          신청 현황 관리
        </h1>
        
        <div className="card table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>날짜/장소</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>신청자</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>술기</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>상태</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {applications.length > 0 ? applications.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{new Date(app.slot.date).toLocaleDateString('ko-KR')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{app.slot.startTime} ~ {app.slot.endTime}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{app.slot.room}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.875rem' }}>{app.representativeUser.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>{app.representativeUser.studentId}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.skills.map(s => s.skill.name).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge badge-${app.status.toLowerCase()}`}>
                      {app.status === 'PENDING' ? '대기' : app.status === 'APPROVED' ? '승인' : 
                       app.status === 'REJECTED' ? '반려' : app.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Link href={`/admin/applications/${app.id}`} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block' }}>
                      상세보기
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--sub-text)' }}>신청 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
