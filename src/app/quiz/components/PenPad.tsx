'use client';

import { useCallback, useEffect, useRef, type PointerEvent as RPointerEvent } from 'react';

type Pt = { x: number; y: number; w: number };

// 손글씨 연습용 메모판. 인식 없이 그냥 써보는 용도 (Apple Pencil·마우스·터치).
export default function PenPad({ height = 180 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Pt[][]>([]);
  const current = useRef<Pt[] | null>(null);
  const penSeen = useRef(false);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#233a8a';
    const all = current.current ? [...strokes.current, current.current] : strokes.current;
    for (const st of all) {
      if (st.length === 1) {
        ctx.beginPath();
        ctx.arc(st[0].x, st[0].y, st[0].w / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#233a8a';
        ctx.fill();
        continue;
      }
      for (let i = 1; i < st.length; i++) {
        ctx.beginPath();
        ctx.lineWidth = st[i].w;
        ctx.moveTo(st[i - 1].x, st[i - 1].y);
        ctx.lineTo(st[i].x, st[i].y);
        ctx.stroke();
      }
    }
  }, []);

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

  const pos = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const pressure = e.pointerType === 'pen' ? Math.max(0.15, e.pressure || 0.5) : 0.5;
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: 1.2 + pressure * 3 };
  };

  const down = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (e.pointerType === 'touch' && penSeen.current) return; // 펜을 쓰는 중이면 손바닥 터치 무시
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = [pos(e)];
    redraw();
  };
  const move = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    current.current.push(pos(e));
    redraw();
  };
  const up = () => {
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    redraw();
  };

  const undo = () => {
    strokes.current.pop();
    redraw();
  };
  const clear = () => {
    strokes.current = [];
    current.current = null;
    redraw();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0E4A84' }}>손글씨</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={undo} className="btn-outline" style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px' }}>
            되돌리기
          </button>
          <button type="button" onClick={clear} className="btn-outline" style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px' }}>
            지우기
          </button>
        </div>
      </div>
      <div
        ref={wrapRef}
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          background:
            'repeating-linear-gradient(to bottom, #fff 0, #fff 43px, #eef2f7 43px, #eef2f7 44px)',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}
