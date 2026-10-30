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
        md: formatInTimeZone(new Date(a.slot.date), TZ, 'M/d'),
        wd: ['일', '월', '화', '수', '목', '금', '토'][new Date(formatInTimeZone(new Date(a.slot.date), TZ, "yyyy-MM-dd'T'12:00:00")).getDay()],
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
                <span className="date">
                  <b>{r.md}</b>
                  <i>{r.wd}</i>
                </span>
                <span className="main">
                  <span className="l1">
                    <b>{r.name}</b>
                    <i>{r.sid}</i>
                    {r.guest && <em>비회원</em>}
                  </span>
                  <span className="l2">{r.skills || '-'}</span>
                </span>
                <span className="side">
                  <b>{r.time}</b>
                  <i>생성 {r.created}</i>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rows.length > limit && (
        <button type="button" className="more" onClick={() => setLimit(l => l + PAGE)}>더 보기</button>
      )}

      <style jsx global>{`
        .al .bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .al .bar input { flex: 1; padding: 11px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 0.9375rem; background: #fff; }
        .al .bar input:focus { outline: none; border-color: var(--primary); }
        .al .bar span { font-size: 0.8125rem; color: var(--sub-text); white-space: nowrap; }
        .al .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .al .row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: #fff; border: 1px solid #e8edf3; border-radius: 14px; text-decoration: none; color: inherit; transition: border-color .15s, box-shadow .15s; }
        .al .row:hover { border-color: #c5cff0; box-shadow: 0 2px 8px rgba(35, 58, 138, 0.06); }
        .al .date { flex: 0 0 48px; height: 48px; border-radius: 12px; background: #eef1fa; color: var(--primary); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.15; }
        .al .date b { font-size: 0.9375rem; font-weight: 800; font-variant-numeric: tabular-nums; }
        .al .date i { font-style: normal; font-size: 0.6875rem; font-weight: 600; opacity: 0.75; }
        .al .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .al .l1 { display: flex; align-items: baseline; gap: 6px; }
        .al .l1 b { font-size: 0.9375rem; font-weight: 800; color: #1e293b; }
        .al .l1 i { font-style: normal; font-size: 0.75rem; color: #94a3b8; }
        .al .l1 em { font-style: normal; font-size: 0.625rem; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 1px 7px; border-radius: 999px; align-self: center; }
        .al .l2 { font-size: 0.8125rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .al .side { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; font-variant-numeric: tabular-nums; }
        .al .side b { font-size: 0.8125rem; font-weight: 700; color: #334155; }
        .al .side i { font-style: normal; font-size: 0.6875rem; color: #94a3b8; }
        .al .more { display: block; margin: 14px auto 0; padding: 9px 22px; border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; font-size: 0.8125rem; font-weight: 700; color: var(--sub-text); cursor: pointer; }
        .al .empty { text-align: center; padding: 48px 12px; color: #94a3b8; }
      `}</style>
    </div>
  );
}
