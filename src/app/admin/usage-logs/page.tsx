import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminUsageLogsPage({ searchParams }: { searchParams: Promise<{ applicationId?: string }> }) {
  const { applicationId } = await searchParams;

  const usageLogs = await prisma.usageLog.findMany({
    where: applicationId ? { applicationId } : {},
    orderBy: { submittedAt: 'desc' },
    include: {
      application: {
        include: {
          representativeUser: true,
          slot: true,
          skills: { include: { skill: true } }
        }
      }
    }
  });

  return (
    <main style={{ padding: '40px 0', backgroundColor: 'var(--muted-background)', flex: 1 }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>실습 소감 내역</h1>
          <Link href="/admin" className="btn-outline">대시보드로 돌아가기</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>제출 일시</th>
                  <th>사용자</th>
                  <th>사용 일시</th>
                  <th>실습 소감</th>
                  <th>정리 상태</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.length > 0 ? usageLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(log.submittedAt).toLocaleString()}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{log.submittedBy}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {new Date(log.application.slot.date).toLocaleDateString()}<br/>
                      {log.application.slot.startTime} ~ {log.application.slot.endTime}
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {log.practiceContent}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        backgroundColor: (log.cleanupChecked && log.wasteChecked) ? '#dcfce7' : '#fee2e2',
                        color: (log.cleanupChecked && log.wasteChecked) ? '#166534' : '#991b1b'
                      }}>
                        {log.cleanupChecked && log.wasteChecked ? '확인됨' : '미흡'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/applications/${log.applicationId}`} className="btn-small btn-outline">
                        신청서 보기
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--sub-text)' }}>
                      제출된 실습 소감이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
