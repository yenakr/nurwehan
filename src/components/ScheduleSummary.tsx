export default function ScheduleSummary() {
  const schedules = [
    { day: '월요일', time: '09:00 - 14:00', desc: '3학년 (09-11), 4학년 (11-12, 13-14)' },
    { day: '화요일', time: '09:00 - 14:00', desc: '2학년 (09-11), 3학년 (13-14)' },
    { day: '수요일', time: '09:00 - 14:00', desc: '2학년 (09-11), 4학년 (11-12, 13-14)' },
    { day: '목요일', time: '미운영', desc: '수업일' },
    { day: '금요일', time: '09:00 - 10:00', desc: '3학년 (09-10)' },
  ];

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="section-title">
        <span>2026-2학기 OPEN LAB 운영 일정</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: '600' }}>요일</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: '600' }}>운영 시간</th>
            <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: '600' }}>대상 학년</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.day} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 4px', fontWeight: '600' }}>{s.day}</td>
              <td style={{ padding: '10px 4px' }}>{s.time}</td>
              <td style={{ padding: '10px 4px', textAlign: 'right', color: s.time === '미운영' ? 'var(--sub-text)' : 'var(--primary)', fontWeight: '500' }}>
                {s.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
