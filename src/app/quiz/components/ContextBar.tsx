'use client';

import s from '../quiz.module.css';
import { Chips, Segmented } from './ui';
import type { QuizKind } from '@/lib/quiz/taxonomy';

export default function ContextBar({
  kind,
  kindCounts,
  onKind,
  quizzes,
  total,
  quiz,
  onQuiz,
}: {
  kind: QuizKind;
  kindCounts: Record<QuizKind, number>;
  onKind: (k: QuizKind) => void;
  quizzes: Array<{ name: string; count: number }>;
  total: number;
  quiz: string;
  onQuiz: (q: string) => void;
}) {
  return (
    <div className={s.bar}>
      <Segmented<QuizKind>
        label="문제 유형"
        value={kind}
        onChange={onKind}
        options={[
          { value: 'TERM', label: '용어', disabled: kindCounts.TERM === 0 },
          { value: 'MULTIPLE_CHOICE', label: '문제', disabled: kindCounts.MULTIPLE_CHOICE === 0 },
        ]}
      />
      <Chips
        label="퀴즈"
        value={quiz}
        onChange={onQuiz}
        options={[{ value: 'all', label: '전체', count: total }, ...quizzes.map(q => ({ value: q.name, label: q.name, count: q.count }))]}
      />
    </div>
  );
}
