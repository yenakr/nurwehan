import Link from 'next/link';
import s from './HomeTiles.module.css';

export interface HomeTilesData {
  canCheck: boolean;
  quizSubject: { subject: string; label: string } | null;
}

const ICONS = {
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9" />
    </svg>
  ),
  clinical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h11l3 3v13H5zM9 11h6M9 15h6" />
    </svg>
  ),
  lab: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
    </svg>
  ),
};

type Act = { href: string; label: string };

function Tile({ href, kind, label, acts }: { href: string; kind: 'quiz' | 'clinical' | 'lab'; label: string; acts: Act[] }) {
  return (
    <div className={`card ${s.tile}`}>
      <Link href={href} className={s.head}>
        <div className={`${s.ic} ${s[kind]}`}>{ICONS[kind]}</div>
        <span className={s.title}>{label}</span>
        <svg className={s.chev} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>
      <div className={s.acts}>
        {acts.map(a => (
          <Link key={a.href + a.label} href={a.href} className={s.act}>{a.label}</Link>
        ))}
      </div>
    </div>
  );
}

export default function HomeTiles({ data }: { data: HomeTilesData }) {
  const quiz: Act[] = [{ href: '/quiz', label: '학습·퀴즈' }];
  if (data.quizSubject) quiz.unshift({ href: `/quiz?subject=${encodeURIComponent(data.quizSubject.subject)}`, label: data.quizSubject.label });
  const note: Act[] = [
    ...(data.canCheck ? [{ href: '/clinical?tab=check', label: '체크리스트' }] : []),
    { href: '/clinical?tab=notes', label: '메모' },
    { href: '/ehr', label: 'EHR 연습' },
    { href: '/clinical?tab=terms', label: '의학용어' },
    { href: '/clinical?tab=mine', label: '내 실습' },
  ];
  const lab: Act[] = [
    { href: '/open-lab', label: '신청서 작성' },
    { href: '/history', label: '작성 내역' },
  ];
  return (
    <div className={s.list}>
      <Tile href="/quiz" kind="quiz" label="QUIZ" acts={quiz} />
      <Tile href="/clinical" kind="clinical" label="실습 노트" acts={note} />
      <Tile href="/open-lab" kind="lab" label="OPEN LAB" acts={lab} />
    </div>
  );
}
