'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const I = (d: string) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

type Row = { icon: ReactNode; text: string };
type Slide = { title: string; icon: ReactNode; rows: Row[]; extra?: ReactNode };

const S = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  check: 'M5 12l4 4 10-10',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  spark: 'M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z',
  book: 'M4 5h7a3 3 0 013 3v11a2 2 0 00-2-2H4zM20 5h-6',
  mark: 'M6 3h12v18l-6-4-6 4z',
  bars: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  doc: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
};

const LV = (
  <div className="gx">
    <i style={{ background: '#dbe6ec', color: '#2f6f8f' }}>관찰</i>
    <i style={{ background: '#f1dfd5', color: '#b4551f' }}>부분수행</i>
    <i style={{ background: '#d8e6dc', color: '#2f7a46' }}>수행</i>
  </div>
);

const SLIDES: Slide[] = [
  {
    title: '기록하기', icon: I(P.check), extra: LV,
    rows: [
      { icon: S(P.check), text: '항목을 눌러 열고 날짜와 시간을 맞춘 뒤 아래 버튼 중 하나를 누르면 바로 기록돼요.' },
      { icon: S(P.pen), text: '기록 오른쪽 연필 버튼으로 날짜, 시간, 메모를 고쳐요.' },
      { icon: S(P.trash), text: '삭제는 수정 창 안의 휴지통 버튼이에요.' },
    ],
  },
  {
    title: 'AI와 공부하기', icon: I(P.spark),
    rows: [
      { icon: S(P.spark), text: '기록 옆 반짝이 버튼을 누르면 AI가 한 단계 더 깊은 질문을 해요.' },
      { icon: S(P.clock), text: '전에 남긴 기록과 관련이 있으면 이어서 물어봐요.' },
      { icon: S(P.link), text: '답변의 점선 밑줄 글씨를 누르면 단어장의 뜻을 보고 단어장으로 넘어가요.' },
    ],
  },
  {
    title: '빠르게 찾기', icon: I(P.mark),
    rows: [
      { icon: S(P.mark), text: '과목과 병동의 북마크 버튼을 누르면 맨 앞에 고정돼요.' },
      { icon: S(P.clock), text: '다시 들어오면 마지막으로 보던 곳이 열려요.' },
      { icon: S(P.bars), text: '요약 화면에서 병동별 진행과 오늘 살펴볼 항목을 볼 수 있어요.' },
    ],
  },
  {
    title: '메모와 PDF', icon: I(P.doc),
    rows: [
      { icon: S(P.doc), text: '메모에서 그날의 체크리스트를 시간순으로 보고 메모에 넣을 수 있어요.' },
      { icon: S(P.spark), text: 'AI와 나눈 대화도 같이 볼 수 있어요.' },
      { icon: S(P.check), text: '체크리스트 아래 PDF 저장은 A4 양식으로 만들어요.' },
    ],
  },
  {
    title: '단어장', icon: I(P.book),
    rows: [
      { icon: S(P.star), text: '용어 카드를 꾹 누르면 즐겨찾기가 켜지고 꺼져요.' },
      { icon: S(P.star), text: '별은 즐겨찾기한 카드에만 보여요.' },
      { icon: S(P.book), text: '검색과 과목 선택으로 필요한 용어만 골라 볼 수 있어요.' },
    ],
  },
];

export default function Guide() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const sc = useRef<HTMLDivElement>(null);

  const go = (n: number) => {
    const el = sc.current;
    if (!el) return;
    const t = Math.max(0, Math.min(SLIDES.length - 1, n));
    el.scrollTo({ left: t * el.clientWidth, behavior: 'smooth' });
    setI(t);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  });

  return (
    <>
      <button type="button" className="gbtn" aria-label="사용법" onClick={() => { setI(0); setOpen(true); }}>?</button>
      {open && (
        <div className="gov" role="dialog" aria-label="사용법" onClick={() => setOpen(false)}>
          <div className="gcard" onClick={e => e.stopPropagation()}>
            <button type="button" className="gx-close" aria-label="닫기" onClick={() => setOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div
              className="gsc"
              ref={sc}
              onScroll={e => {
                const el = e.currentTarget;
                const n = Math.round(el.scrollLeft / el.clientWidth);
                if (n !== i) setI(n);
              }}
            >
              {SLIDES.map((s, k) => (
                <section key={k} className="gsl">
                  <div className="gic">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <ul className="grows">
                    {s.rows.map((r, j) => (
                      <li key={j}><span className="gri">{r.icon}</span><span>{r.text}</span></li>
                    ))}
                  </ul>
                  {s.extra}
                </section>
              ))}
            </div>
            <div className="gft">
              <button type="button" className="gar" aria-label="이전" disabled={i === 0} onClick={() => go(i - 1)}>&lsaquo;</button>
              <div className="gdots">{SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} onClick={() => go(k)} />)}</div>
              {i === SLIDES.length - 1
                ? <button type="button" className="gar done" onClick={() => setOpen(false)}>닫기</button>
                : <button type="button" className="gar" aria-label="다음" onClick={() => go(i + 1)}>&rsaquo;</button>}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .gbtn { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; border: 0; background: rgba(127,127,127,.14); color: var(--sub-text); font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .gov { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .gcard { position: relative; width: 100%; max-width: 400px; background: var(--white); color: var(--text); border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,.3); overflow: hidden; }
        .gx-close { position: absolute; top: 10px; right: 10px; z-index: 2; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 0; background: none; color: var(--sub-text); cursor: pointer; }
        .gsc { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
        .gsc::-webkit-scrollbar { display: none; }
        .gsl { flex: 0 0 100%; scroll-snap-align: center; box-sizing: border-box; padding: 44px 28px 12px; text-align: center; min-height: 380px; display: flex; flex-direction: column; align-items: center; }
        .gic { width: 68px; height: 68px; border-radius: 22px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
        .gsl h3 { margin: 14px 0 16px; font-size: 20px; font-weight: 800; color: var(--primary); }
        .grows { list-style: none; margin: 0; padding: 0; width: 100%; display: flex; flex-direction: column; gap: 12px; text-align: left; }
        .grows li { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; line-height: 1.6; word-break: keep-all; }
        .gri { flex: 0 0 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); }
        .gsl p { margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--text); word-break: keep-all; }
        .gx { display: flex; gap: 6px; margin-top: 16px; }
        .gx i { font-style: normal; font-size: 13px; font-weight: 700; padding: 7px 12px; border-radius: 10px; }
        .gft { display: flex; align-items: center; justify-content: space-between; padding: 6px 14px 16px; }
        .gar { min-width: 40px; height: 40px; border: 0; border-radius: 20px; background: none; color: var(--primary); font: inherit; font-size: 26px; line-height: 1; cursor: pointer; }
        .gar:disabled { opacity: .25; cursor: default; }
        .gar.done { font-size: 14px; font-weight: 700; padding: 0 14px; background: var(--primary); color: #fff; }
        .gdots { display: flex; gap: 6px; }
        .gdots i { width: 7px; height: 7px; border-radius: 50%; background: rgba(127,127,127,.35); cursor: pointer; transition: width .2s, background .2s; }
        .gdots i.on { width: 20px; border-radius: 4px; background: var(--primary); }
      `}</style>
    </>
  );
}
