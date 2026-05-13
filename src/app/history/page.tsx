import Header from '@/components/Header';

export default function HistoryPage() {
  const records = [
    { id: 1, date: '2026-05-15', time: '13:00 - 15:00', room: '제 2 실습실', status: '승인완료', log: '제출대기' },
    { id: 2, date: '2026-05-08', time: '11:00 - 13:00', room: '제 1 실습실', status: '이용완료', log: '제출완료' },
  ];

  return (
    <>
      <Header />
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container">
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
              신청 내역
            </h1>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--muted-background)', borderTop: '2px solid var(--text)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem' }}>No.</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem' }}>사용 일자</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem' }}>사용 시간</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem' }}>장소</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem' }}>상태</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem' }}>사용일지</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>{records.length - idx}</td>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>{r.date}</td>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>{r.time}</td>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>{r.room}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: r.status === '승인완료' ? '#ECFDF5' : '#F3F4F6',
                        color: r.status === '승인완료' ? '#059669' : '#6B7280',
                        fontWeight: '600'
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        {r.log}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
