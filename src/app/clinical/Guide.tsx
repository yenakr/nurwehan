'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const I = (d: string) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

type Slide = { title: string; body: string; icon: ReactNode; extra?: ReactNode };

const LV = (
  <div className="gx">
    <i style={{ background: '#dbe6ec', color: '#2f6f8f' }}>관찰</i>
    <i style={{ background: '#f1dfd5', color: '#b4551f' }}>부분수행</i>
    <i style={{ background: '#d8e6dc', color: '#2f7a46' }}>수행</i>
  </div>
);

const SLIDES: Slide[] = [
  { title: '기록하기', body: '항목을 눌러 열고, 날짜와 시간을 맞춘 뒤 관찰, 부분수행, 수행 중 하나를 누르면 바로 기록돼요.', icon: I('M5 12l4 4 10-10'), extra: LV },
  { title: '고치고 지우기', body: '기록 오른쪽 연필 버튼으로 날짜, 시간, 메모를 고쳐요. 삭제는 수정 창 안의 휴지통 버튼이에요.', icon: I('M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4') },
  { title: 'AI에게 묻기', body: '기록 옆 반짝이 버튼을 누르면 AI가 한 단계 더 깊은 질문을 해요. 전에 남긴 기록과 이어서 물어보기도 해요.', icon: I('M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z') },
  { title: '용어는 단어장으로', body: 'AI 답변에서 점선 밑줄이 있는 굵은 글씨를 누르면 뜻을 보고, 단어장으로 바로 넘어갈 수 있어요.', icon: I('M4 5h7a3 3 0 013 3v11a2 2 0 00-2-2H4zM20 5h-6') },
  { title: '자주 쓰는 것 앞에 두기', body: '과목과 병동의 북마크 버튼을 누르면 맨 앞에 고정돼요. 다시 들어오면 마지막으로 보던 곳이 열려요.', icon: I('M6 3h12v18l-6-4-6 4z') },
  { title: '요약과 오늘 추천', body: '요약 화면에서 병동별 진행을 보고, 오늘 살펴볼 항목과 마지막 기록 이어서를 바로 열 수 있어요.', icon: I('M4 20V10M10 20V4M16 20v-7M22 20H2') },
  { title: '메모와 PDF', body: '메모에서 그날 체크리스트를 시간순으로 보고 넣을 수 있어요. 체크리스트 아래 PDF 저장은 A4 양식으로 만들어요.', icon: I('M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6') },
  { title: '단어장 즐겨찾기', body: '단어장에서 용어 카드를 꾹 누르면 즐겨찾기가 켜지고 꺼져요. 별은 즐겨찾기한 카드에만 보여요.', icon: I('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z') },
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
                  <p>{s.body}</p>
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
        .gcard { position: relative; width: 100%; max-width: 380px; background: var(--white); color: var(--text); border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,.3); overflow: hidden; }
        .gx-close { position: absolute; top: 10px; right: 10px; z-index: 2; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 0; background: none; color: var(--sub-text); cursor: pointer; }
        .gsc { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
        .gsc::-webkit-scrollbar { display: none; }
        .gsl { flex: 0 0 100%; scroll-snap-align: center; box-sizing: border-box; padding: 44px 28px 12px; text-align: center; min-height: 290px; display: flex; flex-direction: column; align-items: center; }
        .gic { width: 68px; height: 68px; border-radius: 22px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
        .gsl h3 { margin: 18px 0 8px; font-size: 20px; font-weight: 800; color: var(--primary); }
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
