'use client';

import { useMemo, useRef, useState } from 'react';

export type PickItem = [string, string]; // [입력값, 보조 설명]

const MAX = 10;

// 품목이 많을 때 검색해서 고르는 입력칸. 글자를 치면 일치하는 항목만 최대 10개 보여준다.
export default function SearchPick({ value, onChange, items, className }: { value: string; onChange: (v: string) => void; items: PickItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [box, setBox] = useState<{ left: number; top: number; width: number } | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const found = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return items.slice(0, MAX);
    const toks = q.split(/\s+/);
    const hit = items.filter(([a, b]) => { const t = `${a} ${b}`.toLowerCase(); return toks.every(k => t.includes(k)); });
    hit.sort((x, y) => Number(!x[0].toLowerCase().startsWith(q)) - Number(!y[0].toLowerCase().startsWith(q)));
    return hit.slice(0, MAX);
  }, [value, items]);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setBox({ left: r.left, top: r.bottom + 2, width: Math.max(r.width, 260) });
    setOpen(true);
    setAt(0);
  };
  const pick = (v: string) => { onChange(v); setOpen(false); };

  return (
    <>
      <input
        ref={ref}
        className={className}
        value={value}
        onChange={e => { onChange(e.target.value); setAt(0); if (!open) show(); }}
        onFocus={show}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={e => {
          if (!open) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setAt(a => Math.min(a + 1, found.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setAt(a => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && found[at]) { e.preventDefault(); pick(found[at][0]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
      />
      {open && box && found.length > 0 && (
        <ul className="spk" role="listbox" style={{ left: box.left, top: box.top, width: box.width }}>
          {found.map(([a, b], k) => (
            <li key={a + k} role="option" aria-selected={k === at} className={k === at ? 'on' : ''} onMouseDown={e => { e.preventDefault(); pick(a); }}>
              <span>{a}</span>{b && <i>{b}</i>}
            </li>
          ))}
        </ul>
      )}
      <style>{`
        .spk { position: fixed; z-index: 80; margin: 0; padding: 4px; list-style: none; max-height: 300px; overflow: auto; background: var(--background, #fff); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
        .spk li { display: flex; justify-content: space-between; gap: 10px; padding: 7px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; }
        .spk li.on, .spk li:hover { background: var(--muted-background); }
        .spk li i { font-style: normal; color: var(--sub-text); font-size: 12px; white-space: nowrap; }
      `}</style>
    </>
  );
}
