'use client';

import { useState } from 'react';
import s from '../quiz.module.css';
import { Chips } from './ui';
import { GRADES, type SubjectEntry } from '@/lib/quiz/taxonomy';

export default function HubView({
  subjects,
  isAdmin,
  onOpen,
  onAddSubject,
}: {
  subjects: SubjectEntry[];
  isAdmin: boolean;
  onOpen: (name: string) => void;
  onAddSubject: (grade?: string) => void;
}) {
  const [grade, setGrade] = useState<string>('all');
  const groups = grade === 'all' ? GRADES.map(g => g as string) : [grade];

  return (
    <>
      <div className={s.head}>
        <h1 className={s.title}>퀴즈</h1>
      </div>
      <Chips
        label="구분"
        large
        value={grade}
        onChange={setGrade}
        options={[{ value: 'all', label: '전체' }, ...GRADES.map(g => ({ value: g as string, label: g }))]}
      />
      {groups.map(g => {
        const list = subjects.filter(x => x.grade === g);
        if (list.length === 0 && !(isAdmin && grade === g)) return null;
        const practice = list.filter(x => x.name.includes('실습'));
        const theory = list.filter(x => !x.name.includes('실습'));
        const split = practice.length > 0 && theory.length > 0;
        const renderCards = (items: SubjectEntry[]) => (
          <div className={s.hubGrid}>
            {items.map(x => (
              <button key={x.name} type="button" className={s.subjectCard} onClick={() => onOpen(x.name)}>
                {x.name}
              </button>
            ))}
          </div>
        );
        return (
          <section key={g} aria-label={g} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {grade === 'all' && <h2 className={s.groupTitle}>{g}</h2>}
            {split ? (
              <>
                <div className={s.divider}><span>이론</span></div>
                {renderCards(theory)}
                <div className={s.divider}><span>실습</span></div>
                {renderCards(practice)}
              </>
            ) : (
              renderCards(list)
            )}
            {isAdmin && grade === g && (
              <div>
                <button type="button" className={s.btn} onClick={() => onAddSubject(g)}>+ 새 과목 추가</button>
              </div>
            )}
          </section>
        );
      })}
      {subjects.length === 0 && <div className={s.empty}>등록된 과목이 없습니다.</div>}
      {isAdmin && grade === 'all' && (
        <div>
          <button type="button" className={s.btn} onClick={() => onAddSubject()}>+ 새 과목 추가</button>
        </div>
      )}
    </>
  );
}
