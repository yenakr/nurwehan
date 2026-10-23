'use client';

import s from '../quiz.module.css';
import { Icon, ICON_CHEVRON, Segmented } from './ui';
import type { QuizKind } from '@/lib/quiz/taxonomy';

type QuizType = 'def_to_term' | 'term_to_def' | 'multiple_choice' | 'abbr_both';

export default function TestSetup({
  kind,
  title,
  poolSize,
  bothAvailable,
  quizType,
  onQuizType,
  quizCount,
  onQuizCount,
  quizOrder,
  onQuizOrder,
  reverse,
  onReverse,
  worksheet,
  onWorksheet,
  onStart,
}: {
  kind: QuizKind;
  title: string;
  poolSize: number;
  bothAvailable: boolean;
  quizType: QuizType;
  onQuizType: (t: QuizType) => void;
  quizCount: number | 'all';
  onQuizCount: (c: number | 'all') => void;
  quizOrder: 'shuffle' | 'normal';
  onQuizOrder: (o: 'shuffle' | 'normal') => void;
  reverse: boolean;
  onReverse: (v: boolean) => void;
  worksheet: boolean;
  onWorksheet: (v: boolean) => void;
  onStart: () => void;
}) {
  const presets = [5, 10, 20].filter(n => n < poolSize);
  const effective = quizCount === 'all' || quizCount >= poolSize ? poolSize : quizCount;
  const countValue: number | 'all' = quizCount === 'all' || quizCount >= poolSize ? 'all' : quizCount;

  return (
    <section aria-label="테스트 설정" className={`${s.panel} ${s.panelNarrow}`}>
      <h2 className={s.panelTitle}>{title}</h2>

      {kind === 'TERM' && (
        <div className={s.field}>
          <div className={s.label}>풀이 방식</div>
          <Segmented<QuizType>
            full
            label="풀이 방식"
            value={quizType === 'multiple_choice' || quizType === 'abbr_both' ? quizType : 'def_to_term'}
            onChange={onQuizType}
            options={[
              { value: 'multiple_choice', label: '4지선다' },
              { value: 'def_to_term', label: '단답형' },
              ...(bothAvailable ? [{ value: 'abbr_both' as QuizType, label: '약어 → 풀네임·뜻' }] : []),
            ]}
          />
        </div>
      )}

      {kind === 'TERM' && quizType !== 'abbr_both' && (
        <div className={s.field}>
          <div className={s.label}>출제 방향</div>
          <Segmented<'fwd' | 'rev'>
            full
            label="출제 방향"
            value={reverse ? 'rev' : 'fwd'}
            onChange={v => onReverse(v === 'rev')}
            options={[
              { value: 'fwd', label: '뜻 → 용어' },
              { value: 'rev', label: '용어 → 뜻' },
            ]}
          />
        </div>
      )}

      <div className={s.field}>
        <div className={s.label}>문제 수</div>
        <Segmented<number | 'all'>
          full
          label="문제 수"
          value={countValue}
          onChange={onQuizCount}
          options={[
            ...presets.map(n => ({ value: n as number | 'all', label: String(n) })),
            { value: 'all', label: `전체 ${poolSize}` },
          ]}
        />
      </div>

      <div className={s.field}>
        <div className={s.label}>순서</div>
        <Segmented<'shuffle' | 'normal'>
          full
          label="순서"
          value={quizOrder}
          onChange={onQuizOrder}
          options={[
            { value: 'shuffle', label: '무작위' },
            { value: 'normal', label: '기본 순서' },
          ]}
        />
      </div>

      <details className={s.details}>
        <summary>
          고급 설정
          <Icon d={ICON_CHEVRON} size={16} />
        </summary>
        <label className={s.check}>
          <input type="checkbox" checked={worksheet} onChange={e => onWorksheet(e.target.checked)} />
          시험지 모드 (모든 문제를 풀고 한 번에 채점)
        </label>
      </details>

      <button type="button" className={`${s.btn} ${s.btnPrimary} ${s.btnBlock}`} disabled={poolSize === 0} onClick={onStart}>
        테스트 시작 · {effective}문제
      </button>
    </section>
  );
}
