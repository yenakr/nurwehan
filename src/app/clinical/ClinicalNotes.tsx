'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { ScheduleItem } from './MySchedule';

export interface Note {
  id: string;
  date: string;
  ward: string;
  content: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const label = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${m}/${d}(${WD[new Date(y, m - 1, d).getDay()]})`;
};
const MAX = 3000;

const addDay = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

export default function ClinicalNotes({
  schedule,
  notes,
  setNotes,
  unavailable,
  targetDate,
}: {
  schedule: ScheduleItem[];
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  unavailable: boolean;
  targetDate?: string;
}) {
  // 실습 평일 목록 (배정된 주의 월~금)
  const practiceDays = useMemo(() => {
    const days: string[] = [];
    schedule.forEach(s => {
      for (let i = 0; i < 5; i++) days.push(addDay(s.startDate, i));
    });
    return Array.from(new Set(days)).sort();
  }, [schedule]);

  const [date, setDate] = useState(() => {
    if (targetDate) return targetDate;
    const t = todayStr();
    if (!practiceDays.length || practiceDays.includes(t)) return t;
    // 오늘이 실습일이 아니면 가장 가까운 다음 실습일(없으면 마지막 실습일)
    return practiceDays.find(d => d > t) ?? practiceDays[practiceDays.length - 1];
  });
  const [wardInput, setWardInput] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (targetDate) setDate(targetDate);
  }, [targetDate]);

  // 그 날짜의 내 배정 병동 (없으면 직접 입력)
  const scheduled = useMemo(() => {
    const it = schedule.find(s => s.startDate <= date && date <= s.endDate);
    return it ? `${it.hospital} ${it.ward}` : '';
  }, [schedule, date]);
  const ward = scheduled || wardInput.trim();

  // 날짜/병동이 바뀌면 저장된 내용을 불러온다
  useEffect(() => {
    const found = notes.find(n => n.date === date && n.ward === ward);
    setContent(found?.content ?? '');
    setStatus('idle');
  }, [date, ward, notes]);

  const save = async () => {
    if (!ward) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/clinical/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ward, content }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes(prev => {
        const rest = prev.filter(n => !(n.date === date && n.ward === ward));
        if (data.deleted) return rest;
        return [{ id: `${date}-${ward}`, date, ward, content: content.trim() }, ...rest].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  const step = (dir: 1 | -1) => {
    if (practiceDays.length) {
      const next = dir === 1 ? practiceDays.find(d => d > date) : [...practiceDays].reverse().find(d => d < date);
      if (next) setDate(next);
    } else {
      setDate(addDay(date, dir));
    }
  };
  const hasPrev = practiceDays.length ? practiceDays.some(d => d < date) : true;
  const hasNext = practiceDays.length ? practiceDays.some(d => d > date) : true;

  const open = (n: Note) => {
    setDate(n.date);
    const inSchedule = schedule.some(s => s.startDate <= n.date && n.date <= s.endDate && `${s.hospital} ${s.ward}` === n.ward);
    if (!inSchedule) setWardInput(n.ward);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          padding: '2px 0 2px 12px',
          borderLeft: '3px solid #f59e0b',
          color: 'var(--sub-text)',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
        }}
      >
        환자 식별 정보(이름·등록번호·병실·생년월일)는 적지 마세요. 메모는 나만 볼 수 있어요.
      </div>

      {unavailable && (
        <div className="card" style={{ color: 'var(--sub-text)', fontSize: '0.875rem' }}>
          메모 저장소가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button className="btn-outline" onClick={() => step(-1)} disabled={!hasPrev} aria-label="이전 실습일" style={{ padding: '4px 12px' }}>
            ‹
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value || todayStr())} style={{ padding: '6px 8px' }} />
          <button className="btn-outline" onClick={() => step(1)} disabled={!hasNext} aria-label="다음 실습일" style={{ padding: '4px 12px' }}>
            ›
          </button>
          {scheduled ? (
            <span style={{ fontWeight: 700 }}>{scheduled}</span>
          ) : practiceDays.length === 0 ? (
            <input
              value={wardInput}
              onChange={e => setWardInput(e.target.value)}
              placeholder="병동 (예: 서울 7층)"
              style={{ padding: '6px 8px', flex: '1 1 160px' }}
            />
          ) : (
            <span style={{ color: 'var(--sub-text)', fontSize: '0.875rem' }}>실습이 없는 날이에요</span>
          )}
        </div>
        <textarea
          value={content}
          onChange={e => {
            setContent(e.target.value.slice(0, MAX));
            setStatus('idle');
          }}
          rows={9}
          placeholder="오늘의 실습 목표, 관찰한 간호, 모르는 용어, 복습할 질문…"
          style={{ width: '100%', padding: '10px', fontSize: '0.9375rem', lineHeight: 1.5 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)' }}>
            {content.length}/{MAX}
            {status === 'saved' && ' · 저장됨'}
            {status === 'error' && ' · 저장 실패'}
          </span>
          <button className="btn-primary" onClick={save} disabled={!ward || status === 'saving'}>
            {status === 'saving' ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px' }}>지난 메모</h3>
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => open(n)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderTop: '1px solid var(--border)',
                padding: '10px 0',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                {label(n.date)} · {n.ward}
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--sub-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.content}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
