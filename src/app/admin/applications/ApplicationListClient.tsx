'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'Asia/Seoul';
const PAGE = 30;

interface Application {
  id: string;
  status: string;
  slot: { date: Date | string; startTime: string; endTime: string; room: string };
  representativeUser: { name: string; studentId: string } | null;
  guestName?: string | null;
  guestStudentId?: string | null;
  skills: Array<{ skill: { name: string } }>;
  createdAt: Date | string;
}

export default function ApplicationListClient({ initialApplications }: { initialApplications: Application[] }) {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return initialApplications
      .map(a => ({
        id: a.id,
        name: a.representativeUser?.name ?? a.guestName ?? '',
        sid: a.representativeUser?.studentId ?? a.guestStudentId ?? '',
        guest: !a.representativeUser,
        skills: a.skills.map(s => s.skill.name).join(', '),
        created: formatInTimeZone(new Date(a.createdAt), TZ, 'MM/dd HH:mm'),
        day: formatInTimeZone(new Date(a.slot.date), TZ, 'MM/dd (EEE)'),
        time: `${a.slot.startTime}~${a.slot.endTime}`,
        ts: new Date(a.createdAt).getTime(),
      }))
      .filter(r => !term || r.name.toLowerCase().includes(term) || r.sid.includes(term) || r.skills.toLowerCase().includes(term))
      .sort((a, b) => b.ts - a.ts);
  }, [initialApplications, q]);

  return (
    <div className="al">
      <div className="bar">
        <input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="이름, 학번, 술기 검색" />
        <span>{rows.length}건</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty">신청서가 없어요</div>
      ) : (
        <ul className="list">
          {rows.slice(0, limit).map(r => (
            <li key={r.id}>
              <Link href={`/admin/applications/${r.id}`} className="row">
                <span className="when">
                  <b>{r.day}</b>
                  <i>{r.time}</i>
                </span>
                <span className="who">
                  <b>{r.name}</b>
                  <i>{r.sid}</i>
                  {r.guest && <em>비회원</em>}
                </span>
                <span className="sk">{r.skills || '-'}</span>
                <span className="ct">{r.created}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rows.length > limit && (
        <button type="button" className="more" onClick={() => setLimit(l => l + PAGE)}>더 보기</button>
      )}

      <style jsx global>{`
        .al .bar{ display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .al .bar input { flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9375rem; background: #fff; }
        .al .bar span { font-size: 0.8125rem; color: var(--sub-text); white-space: nowrap; }
        .al .list{ list-style: none; margin: 0; padding: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .al .list li + li { border-top: 1px solid #f1f5f9; }
        .al .row{ display: grid; grid-template-columns: 112px 150px 1fr auto; gap: 12px; align-items: center; padding: 10px 14px; text-decoration: none; color: inherit; }
        .al .row:hover { background: #f8fafc; }
        .al .when, .al .who { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .al .when b, .al .who b { font-size: 0.875rem; font-weight: 800; }
        .al .when i, .al .who i { font-style: normal; font-size: 0.75rem; color: #94a3b8; }
        .al .who{ flex-direction: row; align-items: baseline; flex-wrap: wrap; gap: 2px 6px; }
        .al .who em { font-style: normal; font-size: 0.625rem; background: #eef2f7; color: #475569; padding: 1px 6px; border-radius: 999px; }
        .al .sk{ font-size: 0.8125rem; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .al .ct{ font-size: 0.75rem; color: #94a3b8; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .al .more{ display: block; margin: 12px auto 0; padding: 8px 20px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; font-size: 0.8125rem; font-weight: 700; color: var(--sub-text); cursor: pointer; }
        .al .empty{ text-align: center; padding: 40px 12px; color: #94a3b8; }
        @media (max-width: 640px) {
          .al .row{ grid-template-columns: 1fr auto; gap: 2px 10px; }
          .al .when{ flex-direction: row; gap: 6px; align-items: baseline; grid-column: 2; grid-row: 1; justify-self: end; }
          .al .who{ grid-column: 1; grid-row: 1; }
          .al .sk{ grid-column: 1; grid-row: 2; }
          .al .ct{ grid-column: 2; grid-row: 2; justify-self: end; }
        }
      `}</style>
    </div>
  );
}
