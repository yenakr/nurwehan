import Link from 'next/link';

const MOCK_NOTICES = [
  { id: 1, title: '2026학년도 1학기 OPEN LAB 운영 안내', date: '2026-05-10', important: true },
  { id: 2, title: '실습실 기자재 사용 후 정리 정돈 협조 요청', date: '2026-05-08', important: false },
  { id: 3, title: '5월 중순 실습실 소독 작업 일정 안내', date: '2026-05-05', important: false },
  { id: 4, title: '간호대학 학생회 공지: 실습복 공동구매', date: '2026-05-02', important: false },
];

export default function NoticeList() {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="section-title">
        <span>최근 공지사항</span>
        <Link href="/notices" style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', fontWeight: '400' }}>
          더보기 +
        </Link>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column' }}>
        {MOCK_NOTICES.map((notice) => (
          <li key={notice.id} style={{ 
            padding: '12px 0', 
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link href={`/notices/${notice.id}`} style={{ 
              fontSize: '0.9375rem', 
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {notice.important && (
                <span style={{ 
                  backgroundColor: '#FEE2E2', 
                  color: '#B91C1C', 
                  fontSize: '0.6875rem', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontWeight: '700'
                }}>중요</span>
              )}
              {notice.title}
            </Link>
            <span style={{ fontSize: '0.8125rem', color: 'var(--sub-text)', flexShrink: 0 }}>
              {notice.date}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
