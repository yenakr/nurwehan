import Header from '@/components/Header';

export default function NoticesPage() {
  const notices = [
    { id: 1, title: '2026학년도 1학기 OPEN LAB 운영 안내', date: '2026-05-10', author: '행정팀', views: 245 },
    { id: 2, title: '실습실 기자재 사용 후 정리 정돈 협조 요청', date: '2026-05-08', author: '행정팀', views: 182 },
    { id: 3, title: '5월 중순 실습실 소독 작업 일정 안내', date: '2026-05-05', author: '행정팀', views: 98 },
    { id: 4, title: '간호대학 학생회 공지: 실습복 공동구매', date: '2026-05-02', author: '학생회', views: 310 },
  ];

  return (
    <>
      <Header />
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container">
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
              공지사항
            </h1>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--muted-background)', borderTop: '2px solid var(--text)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', width: '60px' }}>번호</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem' }}>제목</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', width: '100px' }}>작성자</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', width: '120px' }}>작성일</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem', width: '80px' }}>조회수</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>{n.id}</td>
                    <td style={{ padding: '16px 12px', fontSize: '0.875rem' }}>
                      <a href={`/notices/${n.id}`} style={{ fontWeight: '500' }}>{n.title}</a>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--sub-text)' }}>{n.author}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--sub-text)' }}>{n.date}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--sub-text)' }}>{n.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button className="btn-outline" style={{ padding: '4px 10px' }}>1</button>
              <button className="btn-outline" style={{ padding: '4px 10px', border: 'none' }}>2</button>
              <button className="btn-outline" style={{ padding: '4px 10px', border: 'none' }}>3</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
