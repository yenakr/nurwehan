'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MySchedule, { type ScheduleItem } from './MySchedule';
import ClinicalNotes, { type Note } from './ClinicalNotes';

interface ClinicalClientProps {
  schedule: ScheduleItem[];
  user: any;
}

type Tab = 'mine' | 'notes' | 'terms';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mine', label: '내 실습' },
  { id: 'notes', label: '실습메모' },
  { id: 'terms', label: '실습 의학용어' },
];

// 실습 과목 → 퀴즈 과목명
const QUIZ_SUBJECT: Record<string, string> = {
  성인1: '성인간호실습1',
  성인2: '성인간호실습2',
  간호과정: '간호과정실습',
  여성: '여성간호실습',
};
const quizSubjectOf = (subject: string) => QUIZ_SUBJECT[subject.split('_')[0]];

export default function ClinicalClient({ schedule, user }: ClinicalClientProps) {
  const [tab, setTab] = useState<Tab>('mine');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'btn-primary' : 'btn-outline'}
            style={{ fontSize: '0.875rem' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mine' && (user ? <MySchedule schedule={schedule} me={user.name} noteDates={noteDates} onPickDay={pickDay} /> : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)' }}>
          로그인하면 내 실습 일정을 볼 수 있어요.
        </div>
      ))}

      {tab === 'notes' && (user ? <ClinicalNotes schedule={schedule} notes={notes} setNotes={setNotes} unavailable={unavailable} targetDate={targetDate} /> : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--sub-text)' }}>
          로그인하면 실습메모를 쓸 수 있어요.
        </div>
      ))}

      {tab === 'terms' && (
        <div className="card">
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: '12px' }}>실습 의학용어</h3>
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
    </div>
  );
}
