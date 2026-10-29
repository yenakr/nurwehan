'use client';

import { useMemo } from 'react';
import s from '../quiz.module.css';
import { kindOf, type NursingTerm, type QuizKind } from '@/lib/quiz/taxonomy';

interface Attempt {
  id: string;
  subject: string;
  category?: string | null;
  quizType: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  createdAt: string;
  details?: any;
}

function attemptKind(a: Attempt, terms: NursingTerm[]): QuizKind {
  const d = Array.isArray(a.details) ? a.details[0] : null;
  if (d?.fullTerm) return kindOf(d.fullTerm);
  const found = d?.termId ? terms.find(t => t.id === d.termId) : null;
  if (found) return kindOf(found);
  return (d?.options?.length ?? 0) > 0 ? 'MULTIPLE_CHOICE' : 'TERM';
}

const pill = (rate: number) => (rate >= 80 ? s.pillGood : rate >= 60 ? s.pillMid : s.pillBad);
const modeLabel = (q: string, kind: QuizKind) => (kind === 'MULTIPLE_CHOICE' ? '문제' : q === 'multiple_choice' ? '4지선다' : q === 'abbr_both' ? '용어·국문' : '단답형');
const quizName = (c?: string | null) => (!c || c === 'all' ? '전체' : c);
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const startOf = (a: Attempt) => {
  const st = Array.isArray(a.details) ? a.details[0]?.startedAt : null;
  return typeof st === 'string' ? st : a.createdAt;
};

export default function RecordView({
  attempts,
  loading,
  subject,
  kind,
  quiz,
  terms,
  onReview,
  onRetry,
  onRetryWrong,
  guest,
}: {
  attempts: Attempt[];
  loading: boolean;
  subject: string;
  kind: QuizKind;
  quiz: string;
  terms: NursingTerm[];
  onReview: (a: Attempt) => void;
  onRetry: (a: Attempt) => void;
  onRetryWrong: (wrong: NursingTerm[]) => void;
  guest?: boolean;
}) {
  const rows = useMemo(
    () =>
      attempts.filter(
        a => a.subject === subject && attemptKind(a, terms) === kind && (quiz === 'all' || a.category === quiz)
      ),
    [attempts, subject, kind, quiz, terms]
  );

  const avg = rows.length ? Math.round(rows.reduce((n, a) => n + a.score, 0) / rows.length) : 0;

  // 문항별로 가장 최근 풀이 결과가 오답인 것만 오답노트에 남긴다 (attempts는 최신순)
  const wrongTerms = useMemo(() => {
    const latest = new Map<string, boolean>();
    for (const a of rows) {
      if (!Array.isArray(a.details)) continue;
      for (const d of a.details) {
        if (d?.termId && !latest.has(d.termId)) latest.set(d.termId, !!d.isCorrect);
      }
    }
    const ids = new Set(Array.from(latest).filter(([, ok]) => !ok).map(([id]) => id));
    return terms.filter(t => ids.has(t.id));
  }, [rows, terms]);

  const perQuiz = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const a of rows) {
      const k = quizName(a.category);
      m.set(k, [...(m.get(k) || []), a.score]);
    }
    return Array.from(m, ([name, v]) => ({ name, rate: Math.round(v.reduce((x, y) => x + y, 0) / v.length) }));
  }, [rows]);

  if (guest) {
    return (
      <div className={s.empty}>
        <p style={{ margin: '0 0 14px' }}>로그인하면 최근 학습 현황과 오답 목록을 볼 수 있어요.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a href="/login" className={`${s.btn} ${s.btnPrimary}`} style={{ textDecoration: 'none' }}>로그인</a>
          <a href="/register" className={s.btn} style={{ textDecoration: 'none' }}>회원가입</a>
        </div>
      </div>
    );
  }
  if (loading) return <div className={s.empty}>불러오는 중…</div>;
  if (rows.length === 0) return <div className={s.empty}>아직 푼 기록이 없어요.</div>;

  return (
    <>
      <div className={s.stats}>
        <div className={s.stat}><div className={s.statLabel}>평균 정답률</div><div className={s.statValue}>{avg}%</div></div>
        <div className={s.stat}><div className={s.statLabel}>푼 횟수</div><div className={s.statValue}>{rows.length}회</div></div>
        <div className={s.stat}><div className={s.statLabel}>틀린 문제</div><div className={s.statValue}>{wrongTerms.length}개</div></div>
      </div>

      <div className={s.cols}>
        <section aria-label="최근 기록" className={`${s.list} ${s.colMain}`}>
          {rows.slice(0, 10).map(a => (
            <div key={a.id} className={s.row}>
              <div className={s.rowMain}>
                <div className={s.rowTitle}>{quizName(a.category)} · {modeLabel(a.quizType, kind)}</div>
                <div className={s.rowSub}>{fmtDate(startOf(a))}</div>
              </div>
              <div className={s.rowEnd}>
                <span style={{ fontSize: '0.875rem' }}>{a.correctCount} / {a.totalQuestions}</span>
                <span className={`${s.pill} ${pill(a.score)}`}>{a.score}%</span>
                <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => onReview(a)}>검토</button>
                <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => onRetry(a)}>다시 풀기</button>
              </div>
            </div>
          ))}
        </section>

        <div className={s.colSide}>
          <section aria-label="오답노트" className={s.sideCard}>
            <div className={s.sideTitle}>오답노트</div>
            <div style={{ fontSize: '0.875rem' }}>다시 풀어볼 문제 <b style={{ color: 'var(--q-primary)' }}>{wrongTerms.length}개</b></div>
            <button type="button" className={`${s.btn} ${s.btnPrimary}`} style={{ height: 44 }} disabled={wrongTerms.length === 0} onClick={() => onRetryWrong(wrongTerms)}>
              틀린 문제만 다시 풀기
            </button>
          </section>
          <section aria-label="퀴즈별 정답률" className={s.sideCard}>
            <div className={s.sideTitle}>퀴즈별 정답률</div>
            {perQuiz.map(b => (
              <div key={b.name} className={s.meterRow}>
                <div className={s.meterHead}><span>{b.name}</span><b>{b.rate}%</b></div>
                <div className={s.meter}><div className={s.meterFill} style={{ width: `${b.rate}%` }} /></div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
