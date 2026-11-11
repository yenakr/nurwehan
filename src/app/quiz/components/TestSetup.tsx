'use client';

import s from '../quiz.module.css';
import { Icon, ICON_CHEVRON, Segmented } from './ui';
import type { QuizKind } from '@/lib/quiz/taxonomy';

export type Field = 'term' | 'full' | 'def';
const FIELDS: Array<{ v: Field; label: string }> = [
  { v: 'def', label: '국문' },
  { v: 'full', label: '용어' },
  { v: 'term', label: '약어' },
];

type QuizType = 'def_to_term' | 'term_to_def' | 'multiple_choice' | 'abbr_both';

export default function TestSetup({
  kind,
  title,
  poolSize,
  bothAvailable,
  favCount,
  favOnly,
  onFavOnly,
  quizType,
  onQuizType,
  quizCount,
  onQuizCount,
  quizOrder,
  onQuizOrder,
  prompt,
  targets,
  onSpec,
  worksheet,
  onWorksheet,
  onStart,
  customCount,
  onClearCustom,
}: {
  kind: QuizKind;
  title: string;
  poolSize: number;
  bothAvailable: boolean;
  favCount: number;
  favOnly: boolean;
  onFavOnly: (v: boolean) => void;
  quizType: QuizType;
  onQuizType: (t: QuizType) => void;
  quizCount: number | 'all';
  onQuizCount: (c: number | 'all') => void;
  quizOrder: 'shuffle' | 'normal';
  onQuizOrder: (o: 'shuffle' | 'normal') => void;
  prompt: Field;
  targets: Record<Field, boolean>;
  onSpec: (p: Field, t: Record<Field, boolean>) => void;
  worksheet: boolean;
  onWorksheet: (v: boolean) => void;
  onStart: () => void;
  customCount?: number;
  onClearCustom?: () => void;
}) {
  const presets = [10, 30, 50].filter(n => n < poolSize);
  const custom = customCount != null;
  const effective = custom || quizCount === 'all' || quizCount >= poolSize ? poolSize : quizCount;
  const countValue: number | 'all' = quizCount === 'all' || quizCount >= poolSize ? 'all' : quizCount;

  const eff = FIELDS.filter(f => f.v !== prompt && targets[f.v]);
  const legacyMode = quizType !== 'abbr_both' && eff.length === 1 && ((prompt === 'def' && eff[0].v === 'full') || (prompt === 'full' && eff[0].v === 'def'));
  const pickPrompt = (p: Field) => {
    const t = { ...targets };
    if (!FIELDS.some(f => f.v !== p && t[f.v])) t[FIELDS.find(f => f.v !== p)!.v] = true;
    onSpec(p, t);
  };
  const toggleTarget = (f: Field) => {
    const t = { ...targets, [f]: !targets[f] };
    if (!FIELDS.some(x => x.v !== prompt && t[x.v])) return; // 최소 하나는 선택
    onSpec(prompt, t);
  };

  return (
    <section aria-label="테스트 설정" className={`${s.panel} ${s.panelNarrow}`}>
      <h2 className={s.panelTitle}>{custom ? `오답 ${customCount}개 다시 풀기` : title}</h2>
      {custom && onClearCustom && (
        <button type="button" className={s.selfToggle} onClick={onClearCustom} style={{ alignSelf: 'flex-start', marginTop: -8 }}>
          {title} 전체로 돌아가기
        </button>
      )}

      {favCount > 0 && !custom && (
        <div className={s.field}>
          <div className={s.label}>범위</div>
          <Segmented<'all' | 'fav'>
            full
            label="범위"
            value={favOnly ? 'fav' : 'all'}
            onChange={v => onFavOnly(v === 'fav')}
            options={[
              { value: 'all', label: '전체' },
              { value: 'fav', label: `★ 즐겨찾기 ${favCount}` },
            ]}
          />
        </div>
      )}

      {kind === 'TERM' && (
        <>
          <div className={s.field}>
            <div className={s.label}>제시</div>
            <Segmented<Field>
              full
              label="제시"
              value={prompt}
              onChange={pickPrompt}
              options={FIELDS.map(f => ({ value: f.v, label: f.label, disabled: f.v === 'term' && !bothAvailable }))}
            />
          </div>
          <div className={s.field}>
            <div className={s.label}>쓰기</div>
            <div className={s.chips}>
              {FIELDS.filter(f => f.v !== prompt).map(f => {
                const on = !!targets[f.v];
                return (
                  <button
                    key={f.v}
                    type="button"
                    aria-pressed={on}
                    disabled={f.v === 'term' && !bothAvailable}
                    className={`${s.chip} ${on ? s.chipOn : ''}`}
                    onClick={() => toggleTarget(f.v)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {kind === 'TERM' && legacyMode && (
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

      {!custom && (
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
      )}

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
          시험지 모드
        </label>
      </details>

      <button type="button" className={`${s.btn} ${s.btnPrimary} ${s.btnBlock}`} disabled={poolSize === 0} onClick={onStart}>
        테스트 시작 · {effective}문제
      </button>
    </section>
  );
}
