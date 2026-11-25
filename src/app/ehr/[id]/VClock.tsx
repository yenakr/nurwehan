'use client';

import { useEffect, useState } from 'react';
import { fmtV, parseV, toInput, vnow } from '../vclock';

// EHR 밖(연습 도구)에서 EHR 안의 가상 시각을 정한다
export default function VClock({ base, onSet }: { base?: string; onSet: (v: string) => void }) {
  const [, tick] = useState(0);
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 15000); return () => clearInterval(id); }, []);
  const now = vnow();
  const add = (min: number) => onSet(fmtV(new Date(now.getTime() + min * 60000)));
  return (
    <span className="vclk">
      <button type="button" className="vclkb" title="EHR 가상 시각 설정" aria-expanded={open} onClick={() => { setVal(toInput(now)); setOpen(o => !o); }}>
        <span aria-hidden="true">🕒</span> {fmtV(now)}
      </button>
      {open && (
        <>
          <button type="button" className="vclkbk" aria-label="닫기" onClick={() => setOpen(false)} />
          <div className="vclkp">
            <b>EHR 가상 시각</b>
            <p>EHR 안의 모든 기록 시각·재원일수·투약 지연·검사/협진 진행이 이 시각을 기준으로 흘러요.</p>
            <input type="datetime-local" value={val} onChange={e => setVal(e.target.value)} />
            <div className="r">
              <button type="button" disabled={parseV(val.replace('T', ' ')) == null} onClick={() => { onSet(val.replace('T', ' ')); setOpen(false); }}>이 시각으로 설정</button>
            </div>
            <div className="r">
              {[['+1시간', 60], ['+4시간', 240], ['+8시간 (다음 근무)', 480], ['+1일', 1440]].map(([l, m]) => <button key={l} type="button" onClick={() => add(m as number)}>{l}</button>)}
            </div>
            <div className="r">
              {base && <button type="button" onClick={() => { onSet(base.slice(0, 16)); setOpen(false); }}>시작 시각으로 (최근 설정)</button>}
            </div>
          </div>
        </>
      )}
      <style>{`
        .vclk { position: relative; display: inline-flex; }
        .vclkb { border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 999px; padding: 4px 11px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .vclkbk { position: fixed; inset: 0; z-index: 59; border: 0; background: transparent; }
        .vclkp { position: absolute; right: 0; top: calc(100% + 6px); z-index: 60; width: 280px; background: var(--background, #fff); color: var(--text); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.2); padding: 12px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; }
        .vclkp p { margin: 0; color: var(--sub-text); line-height: 1.5; }
        .vclkp input { padding: 6px 8px !important; border: 1px solid var(--border); border-radius: 6px; font: inherit; width: 100%; box-sizing: border-box; }
        .vclkp .r { display: flex; flex-wrap: wrap; gap: 6px; }
        .vclkp .r button { border: 1px solid var(--border); background: var(--muted-background, #f3f5f8); color: var(--text); border-radius: 6px; padding: 5px 10px; font: inherit; cursor: pointer; }
        .vclkp .r button:disabled { opacity: .4; }
      `}</style>
    </span>
  );
}
