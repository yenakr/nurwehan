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

// 풀네임에서 약어를 이루는 글자를 굵게 (BPD → Biparietal Diameter 의 B, p, D).
// 단어 첫 글자를 우선해서 맞추고, 필요하면 단어 안쪽 글자도 쓴다. 맞추지 못하면 단어 첫 글자만 굵게.
function matchAbbr(full: string, abbr: string): Set<number> | null {
  const letters = abbr.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  const n = full.length;
  const m = letters.length;
  if (!m) return null;
  const isStart = (i: number) => i === 0 || /[\s\-/(]/.test(full[i - 1]);
  const NEG = -1e9;
  // best[j][i]: abbr 앞 j글자를 full 의 i 이전에서 맞췄을 때 최고 점수
  const best: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(NEG));
  const from: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(-1));
  for (let i = 0; i <= n; i++) best[0][i] = 0;
  for (let j = 1; j <= m; j++) {
    for (let i = 1; i <= n; i++) {
      // i 번째 글자(인덱스 i-1)를 쓰지 않는 경우
      if (best[j][i - 1] > best[j][i]) {
        best[j][i] = best[j][i - 1];
        from[j][i] = from[j][i - 1];
      }
      // 사용하는 경우
      if (full[i - 1].toLowerCase() === letters[j - 1] && best[j - 1][i - 1] > NEG) {
        const sc = best[j - 1][i - 1] + (isStart(i - 1) ? 3 : 1);
        if (sc >= best[j][i]) {
          best[j][i] = sc;
          from[j][i] = i - 1;
        }
      }
    }
  }
  if (best[m][n] <= NEG) return null;
  const used = new Set<number>();
  let i = n;
  for (let j = m; j >= 1; j--) {
    const pos = from[j][i];
    if (pos < 0) return null;
    used.add(pos);
    i = pos;
  }
  return used;
}

export function boldInitials(text: string, abbr?: string) {
  const used = abbr ? matchAbbr(text, abbr) : null;
  if (used) {
    return Array.from(text).map((ch, i) => (used.has(i) ? <b key={i}>{ch}</b> : ch));
  }
  return text.split(/(\s+|-)/).map((part, i) =>
    /^(\s+|-)$/.test(part) || !part ? (
      part
    ) : (
      <span key={i}>
        <b>{part[0]}</b>
        {part.slice(1)}
      </span>
    )
  );
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
  favorites,
  onToggleFav,
}: {
  terms: NursingTerm[];
  hideDefinition: boolean;
  revealed: Record<string, boolean>;
  onReveal: (id: string) => void;
  editMode: boolean;
  onMove: (idx: number, dir: 'up' | 'down') => void;
  onEdit: (t: NursingTerm) => void;
  onDelete: (t: NursingTerm) => void;
  favorites?: Set<string>;
  onToggleFav?: (id: string) => void;
}) {
  if (terms.length === 0) return <div className={s.empty}>표시할 항목이 없어요.</div>;

  return (
    <div className={s.grid}>
      {terms.map((t, idx) => {
        const hidden = hideDefinition && !revealed[t.id];
        const hasOptions = (t.options?.length ?? 0) > 0;
        const en = t.englishTerm?.trim();
        return (
          <article key={t.id} className={s.card}>
            <div className={s.cardHead}>
              <span className={s.cardTerm}>{t.term}</span>
              {onToggleFav && (
                <button
                  type="button"
                  className={`${s.star} ${favorites?.has(t.id) ? s.starOn : ''}`}
                  aria-label={favorites?.has(t.id) ? '즐겨찾기 해제' : '즐겨찾기'}
                  aria-pressed={!!favorites?.has(t.id)}
                  onClick={() => onToggleFav(t.id)}
                >
                  {favorites?.has(t.id) ? '★' : '☆'}
                </button>
              )}
              {en && <span className={s.cardEn} style={hidden ? { visibility: 'hidden' } : undefined} aria-hidden={hidden}>{boldInitials(en, t.term)}</span>}
            </div>
            <div className={s.maskWrap}>
              <div style={hidden ? { visibility: 'hidden' } : undefined} aria-hidden={hidden}>
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
              </div>
              {hidden && (
                <button type="button" className={s.maskBtn} onClick={() => onReveal(t.id)}>
                  {en ? '눌러서 용어·국문 보기' : '눌러서 국문 보기'}
                </button>
              )}
            </div>
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
