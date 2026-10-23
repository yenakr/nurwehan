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

  const mode: 'fwd' | 'rev' | 'both' = quizType === 'abbr_both' ? 'both' : reverse ? 'rev' : 'fwd';
  const pickMode = (m: 'fwd' | 'rev' | 'both') => {
    if (m === 'both') {
      onQuizType('abbr_both');
      return;
    }
    if (quizType === 'abbr_both') onQuizType('def_to_term');
    onReverse(m === 'rev');
  };

  return (
    <section aria-label="테스트 설정" className={`${s.panel} ${s.panelNarrow}`}>
      <h2 className={s.panelTitle}>{title}</h2>

      {kind === 'TERM' && (
        <div className={s.field}>
          <div className={s.label}>어떤 문제를 풀까요?</div>
          <div role="radiogroup" aria-label="문제 유형" className={s.choices}>
            {([
              { v: 'fwd', title: '뜻 보고 용어 쓰기', ex: '전대뇌동맥 → ACA' },
              { v: 'rev', title: '용어 보고 뜻 쓰기', ex: 'ACA → 전대뇌동맥' },
              ...(bothAvailable ? [{ v: 'both', title: '약어 보고 풀네임·뜻 쓰기', ex: 'ACA → Anterior cerebral artery, 전대뇌동맥' }] : []),
            ] as Array<{ v: 'fwd' | 'rev' | 'both'; title: string; ex: string }>).map(o => {
              const on = o.v === mode;
              return (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`${s.choice} ${on ? s.choiceOn : ''}`}
                  onClick={() => pickMode(o.v)}
                >
                  <span className={s.choiceTitle}>{o.title}</span>
                  <span className={s.choiceEx}>{o.ex}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {kind === 'TERM' && quizType !== 'abbr_both' && (
        <div className={s.field}>
          <div className={s.label}>답하는 방식</div>
          <Segmented<QuizType>
            full
            label="답하는 방식"
            value={quizType === 'multiple_choice' ? 'multiple_choice' : 'def_to_term'}
            onChange={onQuizType}
            options={[
              { value: 'def_to_term', label: '직접 쓰기' },
              { value: 'multiple_choice', label: '4지선다' },
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
