'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type ReactNode,
} from 'react';

type Pt = { x: number; y: number; w: number };
type PadApi = { undo: () => void; clear: () => void };

interface Ctx {
  erase: boolean;
  eraseRef: { current: boolean };
  register: (id: string, api: PadApi) => () => void;
  setActive: (id: string) => void;
}

const PenCtx = createContext<Ctx | null>(null);

// 손글씨칸들이 공유하는 도구(지우개/되돌리기/전체 지우기). 마지막으로 쓴 칸에 적용된다.
export function PenProvider({ children }: { children: ReactNode }) {
  const [erase, setEraseState] = useState(false);
  const eraseRef = useRef(false);
  const pads = useRef(new Map<string, PadApi>());
  const active = useRef<string | null>(null);

  const ctx: Ctx = {
    erase,
    eraseRef,
    register: (id, api) => {
      pads.current.set(id, api);
      return () => {
        pads.current.delete(id);
        if (active.current === id) active.current = null;
      };
    },
    setActive: id => {
      active.current = id;
    },
  };

  const toggleErase = () => {
    eraseRef.current = !eraseRef.current;
    setEraseState(eraseRef.current);
  };
  const lastPad = () => {
    const id = active.current;
    if (id && pads.current.has(id)) return pads.current.get(id)!;
    const all = Array.from(pads.current.values());
    return all[all.length - 1];
  };

  const btn = { fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', fontWeight: 700, background: '#fff' } as const;

  return (
    <PenCtx.Provider value={ctx}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--sub-text)', marginRight: '2px' }}>손글씨</span>
        <button
          type="button"
          onClick={toggleErase}
          aria-pressed={erase}
          className="btn-outline"
          style={erase ? { ...btn, background: '#233a8a', color: '#fff', borderColor: '#233a8a' } : btn}
        >
          지우개
        </button>
        <button type="button" onClick={() => lastPad()?.undo()} className="btn-outline" style={btn}>
          ↶ 되돌리기
        </button>
        <button type="button" onClick={() => pads.current.forEach(p => p.clear())} className="btn-outline" style={btn}>
          전체 지우기
        </button>
      </div>
      {children}
    </PenCtx.Provider>
  );
}

// 손글씨 연습용 메모판. 인식 없이 그냥 써보는 용도 (Apple Pencil·마우스·터치).
export default function PenPad({ height = 180 }: { height?: number }) {
  const ctx = useContext(PenCtx);
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Pt[][]>([]);
  const current = useRef<Pt[] | null>(null);
  const penSeen = useRef(false);
  const erasingNow = useRef(false);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const ctx2 = c?.getContext('2d');
    if (!c || !ctx2) return;
    const dpr = window.devicePixelRatio || 1;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2.clearRect(0, 0, c.width, c.height);
    ctx2.lineCap = 'round';
    ctx2.lineJoin = 'round';
    ctx2.strokeStyle = '#233a8a';
    const all = current.current ? [...strokes.current, current.current] : strokes.current;
    for (const st of all) {
      if (st.length === 1) {
        ctx2.beginPath();
        ctx2.arc(st[0].x, st[0].y, st[0].w / 2, 0, Math.PI * 2);
        ctx2.fillStyle = '#233a8a';
        ctx2.fill();
        continue;
      }
      for (let i = 1; i < st.length; i++) {
        ctx2.beginPath();
        ctx2.lineWidth = st[i].w;
        ctx2.moveTo(st[i - 1].x, st[i - 1].y);
        ctx2.lineTo(st[i].x, st[i].y);
        ctx2.stroke();
      }
    }
  }, []);

  const undo = useCallback(() => {
    strokes.current.pop();
    redraw();
  }, [redraw]);
  const clear = useCallback(() => {
    strokes.current = [];
    current.current = null;
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(id, { undo, clear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, undo, clear]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const c = canvasRef.current;
    if (!wrap || !c) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      c.width = Math.round(w * dpr);
      c.height = Math.round(height * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${height}px`;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [height, redraw]);

  // iOS/Safari: 길게 누름(선택·복사 메뉴)과 선택 시작을 원천 차단
  useEffect(() => {
    const wrap = wrapRef.current;
    const c = canvasRef.current;
    if (!wrap || !c) return;
    const stop = (e: Event) => e.preventDefault();
    c.addEventListener('touchstart', stop, { passive: false });
    c.addEventListener('touchmove', stop, { passive: false });
    wrap.addEventListener('selectstart', stop);
    wrap.addEventListener('contextmenu', stop);
    wrap.addEventListener('dragstart', stop);
    return () => {
      c.removeEventListener('touchstart', stop);
      c.removeEventListener('touchmove', stop);
      wrap.removeEventListener('selectstart', stop);
      wrap.removeEventListener('contextmenu', stop);
      wrap.removeEventListener('dragstart', stop);
    };
  }, []);

  const pos = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const pressure = e.pointerType === 'pen' ? Math.max(0.15, e.pressure || 0.5) : 0.5;
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: 1.7 + pressure * 3.4 };
  };

  // 지우개: 지나간 자리에 닿은 획을 통째로 지운다
  const eraseAt = (x: number, y: number) => {
    const R = 14;
    const before = strokes.current.length;
    strokes.current = strokes.current.filter(st => !st.some(p => Math.hypot(p.x - x, p.y - y) < R));
    if (strokes.current.length !== before) redraw();
  };

  const down = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (e.pointerType === 'touch' && penSeen.current) return; // 펜을 쓰는 중이면 손바닥 터치 무시
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    ctx?.setActive(id);
    erasingNow.current = !!ctx?.eraseRef.current || (e.buttons & 32) === 32;
    const p = pos(e);
    if (erasingNow.current) {
      eraseAt(p.x, p.y);
      return;
    }
    current.current = [p];
    redraw();
  };
  const move = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (erasingNow.current) {
      if (e.buttons === 0) return;
      const p = pos(e);
      eraseAt(p.x, p.y);
      return;
    }
    if (!current.current) return;
    current.current.push(pos(e));
    redraw();
  };
  const up = () => {
    if (erasingNow.current) {
      erasingNow.current = false;
      return;
    }
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    redraw();
  };

  const lineH = Math.round(height / 2);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: `repeating-linear-gradient(to bottom, #fff 0, #fff ${lineH - 1}px, #eef2f7 ${lineH - 1}px, #eef2f7 ${lineH}px)`,
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onContextMenu={e => e.preventDefault()}
        style={{ display: 'block', touchAction: 'none', cursor: ctx?.erase ? 'cell' : 'crosshair', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      />
    </div>
  );
}
