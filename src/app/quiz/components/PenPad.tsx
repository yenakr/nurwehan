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
export function PenProvider({ children, showToolbar = true }: { children: ReactNode; showToolbar?: boolean }) {
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
      {showToolbar && <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: '12px' }}>
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
      </div>}
      {children}
    </PenCtx.Provider>
  );
}

const INK = '#233a8a';
const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// i번째 점을 조절점으로 하는 곡선 한 마디 (이전·다음 점의 중점 사이를 부드럽게 잇는다)
function seg(c: CanvasRenderingContext2D, pts: Pt[], i: number, last: boolean) {
  const start = i === 1 ? pts[0] : mid(pts[i - 1], pts[i]);
  const end = last ? pts[i] : mid(pts[i], pts[i + 1]);
  c.beginPath();
  c.lineWidth = pts[i].w;
  c.moveTo(start.x, start.y);
  c.quadraticCurveTo(pts[i].x, pts[i].y, end.x, end.y);
  c.stroke();
}

function drawStroke(c: CanvasRenderingContext2D, pts: Pt[]) {
  if (pts.length === 1) {
    c.beginPath();
    c.arc(pts[0].x, pts[0].y, pts[0].w / 2, 0, Math.PI * 2);
    c.fillStyle = INK;
    c.fill();
    return;
  }
  if (pts.length === 2) {
    c.beginPath();
    c.lineWidth = pts[1].w;
    c.moveTo(pts[0].x, pts[0].y);
    c.lineTo(pts[1].x, pts[1].y);
    c.stroke();
    return;
  }
  for (let i = 1; i < pts.length; i++) seg(c, pts, i, i === pts.length - 1);
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
  const lastRaw = useRef<{ x: number; y: number; t: number } | null>(null);

  const setup = (c: HTMLCanvasElement) => {
    const g = c.getContext('2d');
    if (!g) return null;
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = INK;
    return g;
  };

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const g = setup(c);
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    const all = current.current ? [...strokes.current, current.current] : strokes.current;
    for (const st of all) drawStroke(g, st);
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

  // 지우개: 지나간 자리에 닿은 획을 통째로 지운다
  const eraseAt = (x: number, y: number) => {
    const R = 14;
    const before = strokes.current.length;
    strokes.current = strokes.current.filter(st => !st.some(p => Math.hypot(p.x - x, p.y - y) < R));
    if (strokes.current.length !== before) redraw();
  };

  // 한 점 추가: 위치와 굵기를 살짝 평균내서 손떨림과 각진 선을 줄인다
  const addPoint = (g: CanvasRenderingContext2D, x: number, y: number, pressure: number, isPen: boolean, t: number) => {
    const pts = current.current;
    if (!pts) return;
    const prev = pts[pts.length - 1];
    const raw = lastRaw.current;
    if (raw && Math.hypot(x - raw.x, y - raw.y) < 0.8) return;
    let target: number;
    if (isPen) {
      target = 1.5 + pressure * 3.2;
    } else {
      const dt = raw ? Math.max(1, t - raw.t) : 16;
      const speed = raw ? Math.hypot(x - raw.x, y - raw.y) / dt : 0; // px/ms
      target = Math.max(1.6, 3.6 - speed * 1.6);
    }
    lastRaw.current = { x, y, t };
    const a = isPen ? 0.7 : 0.5;
    const p: Pt = { x: prev.x + (x - prev.x) * a, y: prev.y + (y - prev.y) * a, w: prev.w + (target - prev.w) * 0.3 };
    pts.push(p);
    // 새로 생긴 마디만 그린다 (전체를 다시 그리지 않아 지연이 없다)
    if (pts.length >= 3) seg(g, pts, pts.length - 2, false);
  };

  const down = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (e.pointerType === 'touch' && penSeen.current) return; // 펜을 쓰는 중이면 손바닥 터치 무시
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    ctx?.setActive(id);
    erasingNow.current = !!ctx?.eraseRef.current || (e.buttons & 32) === 32;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (erasingNow.current) {
      eraseAt(x, y);
      return;
    }
    const pen = e.pointerType === 'pen';
    const w = pen ? 1.5 + Math.max(0.15, e.pressure || 0.5) * 3.2 : 2.6;
    current.current = [{ x, y, w }];
    lastRaw.current = { x, y, t: e.timeStamp };
  };
  const move = (e: RPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const native = e.nativeEvent;
    const evs = typeof native.getCoalescedEvents === 'function' && native.getCoalescedEvents().length ? native.getCoalescedEvents() : [native];
    if (erasingNow.current) {
      if (e.buttons === 0) return;
      for (const ev of evs) eraseAt(ev.clientX - r.left, ev.clientY - r.top);
      return;
    }
    if (!current.current) return;
    const g = setup(c);
    if (!g) return;
    const pen = e.pointerType === 'pen';
    for (const ev of evs) addPoint(g, ev.clientX - r.left, ev.clientY - r.top, Math.max(0.15, ev.pressure || 0.5), pen, ev.timeStamp);
  };
  const up = () => {
    if (erasingNow.current) {
      erasingNow.current = false;
      return;
    }
    const pts = current.current;
    if (!pts) return;
    const c = canvasRef.current;
    const g = c && setup(c);
    // 마지막 마디를 끝점까지 마무리
    if (g) {
      if (pts.length >= 3) seg(g, pts, pts.length - 1, true);
      else drawStroke(g, pts);
    }
    strokes.current.push(pts);
    current.current = null;
    lastRaw.current = null;
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
