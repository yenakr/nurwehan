'use client';

import s from '../quiz.module.css';
import type { NursingTerm } from '@/lib/quiz/taxonomy';

function isCorrectOption(opt: string, answer?: string | null, definition?: string | null): boolean {
  const target = answer || definition || '';
  if (!target) return false;
  const strip = (v: string) => v.trim().replace(/^\([0-9]\)|^[①-⑤]/, '').trim();
  const cleanOpt = strip(opt);
  const cleanAns = strip(target.replace(/^정답:\s*/, ''));
  const optNum = opt.match(/^([①-⑤]|\([1-5]\))/);
  const ansNum = target.match(/^([①-⑤]|\([1-5]\))/);
  if (optNum && ansNum && optNum[1] === ansNum[1]) return true;
  return cleanOpt === cleanAns || (cleanAns.length > 3 && cleanOpt.includes(cleanAns)) || (cleanOpt.length > 3 && cleanAns.includes(cleanOpt));
}

export default function TermCards({
  terms,
  hideDefinition,
  revealed,
  onReveal,
  editMode,
  onMove,
  onEdit,
  onDelete,
}: {
  terms: NursingTerm[];
  hideDefinition: boolean;
  revealed: Record<string, boolean>;
  onReveal: (id: string) => void;
  editMode: boolean;
  onMove: (idx: number, dir: 'up' | 'down') => void;
  onEdit: (t: NursingTerm) => void;
  onDelete: (t: NursingTerm) => void;
}) {
  if (terms.length === 0) return <div className={s.empty}>표시할 항목이 없습니다.</div>;

  return (
    <div className={s.grid}>
      {terms.map((t, idx) => {
        const hidden = hideDefinition && !revealed[t.id];
        const hasOptions = (t.options?.length ?? 0) > 0;
        const en = t.englishTerm?.trim();
        return (
          <article key={t.id} className={s.card}>
            <div>
              <div className={s.cardTerm}>{t.term}</div>
              {en && !hidden && <div className={s.cardEn}>{en}</div>}
            </div>
            <div className={s.cardDivider} />
            {hidden ? (
              <button type="button" className={s.hidden} onClick={() => onReveal(t.id)}>
                {en ? '눌러서 풀네임·뜻 보기' : '눌러서 뜻 보기'}
              </button>
            ) : (
              <>
                {hasOptions && (
                  <div className={s.options}>
                    {t.options!.map((opt, i) => (
                      <div key={i} className={`${s.option} ${isCorrectOption(opt, t.answer, t.definition) ? s.optionOk : ''}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                <p className={s.cardBody}>{hasOptions && t.answer ? `정답: ${t.answer}\n${t.definition}` : t.definition}</p>
                {t.example && <div className={s.cardNote}>{t.example}</div>}
              </>
            )}
            {editMode && (
              <div className={s.cardActions}>
                <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={idx === 0} aria-label="위로" onClick={() => onMove(idx, 'up')}>▲</button>
                <button type="button" className={`${s.btn} ${s.btnSm}`} disabled={idx === terms.length - 1} aria-label="아래로" onClick={() => onMove(idx, 'down')}>▼</button>
                <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => onEdit(t)}>수정</button>
                <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => onDelete(t)}>삭제</button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
