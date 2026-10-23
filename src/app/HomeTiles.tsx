import Link from 'next/link';
import s from './HomeTiles.module.css';

export interface TileStat {
  value: string;
  label: string;
}
export interface HomeTilesData {
  quiz: TileStat[];
  clinical: TileStat[];
  lab: TileStat[];
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
      <path d="M12 5v14M5 12h14" />
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </svg>
  ),
  lab: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
    </svg>
  ),
};

function Tile({
  href,
  kind,
  label,
  stats,
}: {
  href: string;
  kind: 'quiz' | 'clinical' | 'lab';
  label: string;
  stats: TileStat[];
}) {
  return (
    <Link href={href} className={`card ${s.tile}`}>
      <div className={`${s.sq} ${s[kind]}`}>
        {ICONS[kind]}
        <span>{label}</span>
      </div>
      {stats.length > 0 ? (
        <div className={s.stats}>
          {stats.map(st => (
            <div key={st.label} className={s.stat}>
              <b>{st.value}</b>
              <span>{st.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={s.go}>바로가기 →</div>
      )}
    </Link>
  );
}

export default function HomeTiles({ data }: { data: HomeTilesData }) {
  return (
    <div className={s.list}>
      <Tile href="/quiz" kind="quiz" label="QUIZ" stats={data.quiz} />
      <Tile href="/clinical" kind="clinical" label="임상실습" stats={data.clinical} />
      <Tile href="/open-lab" kind="lab" label="OPEN LAB" stats={data.lab} />
    </div>
  );
}
