'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MySchedule, { type ScheduleItem } from './MySchedule';
import ClinicalNotes, { type Note } from './ClinicalNotes';
import Checklist from './Checklist';
import { normalizeStore, type Store } from './practicum-data';

interface ClinicalClientProps {
  schedule: ScheduleItem[];
  user: any;
  progress: Record<string, Record<string, unknown>>;
  aiOn?: boolean;
  canCheck?: boolean;
}

type Tab = 'mine' | 'notes' | 'check' | 'terms';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mine', label: '내 실습' },
  { id: 'notes', label: '메모' },
  { id: 'check', label: '체크리스트' },
  { id: 'terms', label: '의학용어' },
];

// 실습 과목 → 퀴즈 과목명
const QUIZ_SUBJECT: Record<string, string> = {
  성인1: '성인간호실습1',
  성인2: '성인간호실습2',
  간호과정: '간호과정실습',
  여성: '여성간호실습',
};
const quizSubjectOf = (subject: string) => QUIZ_SUBJECT[subject.split('_')[0]];

export default function ClinicalClient({ schedule, user, progress, aiOn, canCheck }: ClinicalClientProps) {
  const [tab, setTab] = useState<Tab>('mine');
  const [prog, setProg] = useState<Record<string, Store>>(() => Object.fromEntries(Object.entries(progress).map(([k, v]) => [k, normalizeStore(v)])));
  const [notes, setNotes] = useState<Note[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    fetch('/api/clinical/notes')
      .then(r => r.json())
      .then(d => {
        setNotes(d.notes || []);
        if (d.unavailable) setUnavailable(true);
      })
      .catch(() => setUnavailable(true));
  }, [user]);

  const noteDates = useMemo(() => new Set(notes.map(n => n.date)), [notes]);
  const pickDay = (date: string) => {
    setTargetDate(date);
    setTab('notes');
  };

  // 내 실습 과목을 주차 순서대로 중복 없이
  const subjects: { quiz: string; weekNo: number; place: string }[] = [];
  schedule.forEach(s => {
    const quiz = quizSubjectOf(s.subject);
    if (quiz && !subjects.some(x => x.quiz === quiz)) {
      subjects.push({ quiz, weekNo: s.weekNo, place: `${s.hospital} ${s.ward}` });
    }
  });
  const allQuiz = Object.values(QUIZ_SUBJECT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="mtabs">
        {TABS.filter(t => t.id !== 'check' || canCheck).map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={tab === t.id ? 'on' : ''}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mine' && (user ? <MySchedule schedule={schedule} me={user.name} noteDates={noteDates} onPickDay={pickDay} /> : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)' }}>
          로그인하면 내 실습 일정을 볼 수 있어요.
        </div>
      ))}

      {tab === 'notes' && (user ? <ClinicalNotes progress={prog} schedule={schedule} notes={notes} setNotes={setNotes} unavailable={unavailable} targetDate={targetDate} /> : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)' }}>
          로그인하면 메모를 쓸 수 있어요.
        </div>
      ))}

      {user && canCheck && (
        <div style={{ display: tab === 'check' ? 'block' : 'none' }}>
          <Checklist aiOn={aiOn} schedule={schedule} studentId={user?.studentId} userName={user?.name} defaultCourse={['여성', '성인2', '간호과정'].find(c => schedule.some(x => x.subject.split('_')[0] === c))} all={prog} setAll={setProg} noteDates={noteDates} onPickDay={pickDay} />
        </div>
      )}
      {tab === 'check' && !user && canCheck && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)' }}>
          로그인하면 체크리스트를 기록할 수 있어요.
        </div>
      )}

      {tab === 'terms' && (
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: '12px' }}>의학용어</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(subjects.length ? subjects.map(s => s.quiz) : allQuiz).map(name => {
              const mine = subjects.find(s => s.quiz === name);
              return (
                <Link
                  key={name}
                  href={`/quiz?subject=${encodeURIComponent(name)}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontWeight: 700,
                  }}
                >
                  <span>
                    {name}
                    {mine && (
                      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--sub-text)' }}>
                        {mine.weekNo}주차 · {mine.place}
                      </span>
                    )}
                  </span>
                  <span style={{ color: 'var(--primary)' }}>›</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <style jsx global>{`
        .mtabs { display: flex; background: rgba(127,127,127,.14); border-radius: 10px; padding: 3px; gap: 2px; }
        .mtabs button { flex: 1; border: 0; background: none; border-radius: 8px; padding: 7px 0; font: inherit; font-size: 14px; font-weight: 600; color: var(--sub-text); cursor: pointer; white-space: nowrap; }
        .mtabs button.on { background: var(--primary); color: #fff; }
      `}</style>
    </div>
  );
}
