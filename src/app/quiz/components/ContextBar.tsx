'use client';

import type { ReactNode } from 'react';
import s from '../quiz.module.css';
import { Chips } from './ui';

export default function ContextBar({
  quizzes,
  total,
  quiz,
  onQuiz,
  trailing,
}: {
  quizzes: Array<{ name: string; count: number }>;
  total: number;
  quiz: string;
  onQuiz: (q: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className={s.bar}>
      {trailing && <div className={s.barTop}>{trailing}</div>}
      <Chips
        label="퀴즈"
        value={quiz}
        onChange={onQuiz}
        options={[{ value: 'all', label: '전체', count: total }, ...quizzes.map(q => ({ value: q.name, label: q.name.replace(/\s*약어$/, ''), count: q.count }))]}
      />
    </div>
  );
}
