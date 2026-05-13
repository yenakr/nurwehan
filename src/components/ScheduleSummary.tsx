export default function ScheduleSummary() {
  const schedules = [
    { day: '월요일', time: '09:00 - 18:00', status: '운영' },
    { day: '화요일', time: '09:00 - 21:00', status: '야간운영' },
    { day: '수요일', time: '09:00 - 18:00', status: '운영' },
    { day: '목요일', time: '09:00 - 21:00', status: '야간운영' },
    { day: '금요일', time: '09:00 - 17:00', status: '운영' },
  ];

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="section-title">
        <span>OPEN LAB 운영 일정</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: '600' }}>요일</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: '600' }}>운영 시간</th>
            <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: '600' }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.day} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 4px' }}>{s.day}</td>
              <td style={{ padding: '10px 4px' }}>{s.time}</td>
              <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                <span style={{
                  color: s.status === '야간운영' ? 'var(--primary)' : 'var(--text)',
                  fontWeight: s.status === '야간운영' ? '600' : '400'
                }}>
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
