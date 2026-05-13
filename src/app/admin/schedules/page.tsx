import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminSchedulesPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect('/admin');
  }

  const rules = await prisma.openLabGradeRule.findMany({
    orderBy: [
      { grade: 'asc' },
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  });

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>학년별 운영시간 관리</h1>
          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>+ 새 운영시간 추가</button>
        </div>

        <div className="card table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>학년</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>요일</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>시간</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem' }}>실습실</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>정원</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>상태</th>
                <th style={{ padding: '12px', fontSize: '0.8125rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: '600' }}>{rule.grade}학년</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{dayNames[rule.dayOfWeek]}요일</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{rule.startTime} - {rule.endTime}</td>
                  <td style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--primary)' }}>{rule.room}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem', textAlign: 'center' }}>{rule.maxCapacity}명</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span className={`badge ${rule.isActive ? 'badge-approved' : 'badge-rejected'}`} style={{ fontSize: '0.75rem' }}>
                      {rule.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>수정</button>
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
