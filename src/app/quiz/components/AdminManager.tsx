'use client';

import { useState } from 'react';
import s from '../quiz.module.css';
import { GRADES } from '@/lib/quiz/taxonomy';

async function patch(url: string, body: object): Promise<string | null> {
  try {
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error || '저장하지 못했습니다.';
  } catch {
    return '네트워크 오류가 발생했습니다.';
  }
}

export default function AdminManager({
  subject,
  grade,
  level,
  quizzes,
  onClose,
  onDone,
}: {
  subject: string;
  grade: string;
  level: string;
  quizzes: string[];
  onClose: () => void;
  onDone: (change: { subject?: string; level?: string; category?: { from: string; to: string } }) => void;
}) {
  const [name, setName] = useState(subject);
  const [g, setG] = useState(grade);
  const [lv, setLv] = useState(level);
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(quizzes.map(q => [q, q])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saveSubject = async () => {
    setBusy(true);
    setError('');
    const err = await patch('/api/admin/quiz/subjects', { subject, newSubject: name.trim(), grade: g, level: lv });
    setBusy(false);
    if (err) return setError(err);
    onDone({ subject: name.trim() || subject, level: lv });
  };

  const saveQuiz = async (q: string) => {
    const next = names[q]?.trim();
    if (!next || next === q) return;
    setBusy(true);
    setError('');
    const err = await patch('/api/admin/quiz/categories', { subject, category: q, newCategory: next });
    setBusy(false);
    if (err) return setError(err);
    onDone({ category: { from: q, to: next } });
  };

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label="과목 관리" onClick={onClose}>
      <div className={s.dialog} onClick={e => e.stopPropagation()}>
        <h2 className={s.panelTitle}>과목 관리</h2>

        <div className={s.field}>
          <label className={s.label} htmlFor="mg-name">과목 이름</label>
          <input id="mg-name" className={s.input} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="mg-grade">구분</label>
          <select id="mg-grade" className={s.input} value={g} onChange={e => setG(e.target.value)}>
            {GRADES.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="mg-level">공개 범위</label>
          <select id="mg-level" className={s.input} value={lv} onChange={e => setLv(e.target.value)}>
            <option value="NORMAL">일반 (모든 승인 회원)</option>
            <option value="PARTIAL">일부공개 (지정한 회원만)</option>
            <option value="PRIVATE">비공개 (관리자만)</option>
          </select>
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled={busy || !name.trim()} onClick={saveSubject}>
          과목 저장
        </button>

        {quizzes.length > 0 && (
          <div className={s.field}>
            <h3 className={s.sectionTitle}>퀴즈 이름</h3>
            {quizzes.map(q => (
              <div key={q} className={s.manageRow}>
                <input className={s.input} aria-label={`${q} 이름`} value={names[q] ?? q} onChange={e => setNames(p => ({ ...p, [q]: e.target.value }))} />
                <button type="button" className={s.btn} disabled={busy || !names[q]?.trim() || names[q].trim() === q} onClick={() => saveQuiz(q)}>
                  변경
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <div className={s.error} role="alert">{error}</div>}
        <button type="button" className={s.btn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
