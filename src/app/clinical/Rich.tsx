'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Hit = { subject: string; term: string; englishTerm: string | null; definition: string };

// 같은 키워드를 다시 조회하지 않도록 모듈 단위로 보관
const cache = new Map<string, Hit[]>();

// AI 답변의 **강조**를 남색 굵은 글씨로 보여 주고, 단어장에 있는 용어는 눌러서 뜻을 볼 수 있게 한다
export default function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  const keys = Array.from(new Set(parts.filter((_, i) => i % 2).map(p => p.trim()))).filter(k => k.length >= 2 && k.length <= 60).slice(0, 8);
  const sig = keys.join('|');
  const [, bump] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const need = sig.split('|').filter(k => k && !cache.has(k));
    if (!need.length) return;
    let off = false;
    fetch(`/api/quiz/lookup?q=${encodeURIComponent(need.join('|'))}`)
      .then(r => (r.ok ? r.json() : { found: {} }))
      .then(d => {
        need.forEach(k => cache.set(k, d.found?.[k] || []));
        if (!off) bump(n => n + 1);
      })
      .catch(() => {});
    return () => { off = true; };
  }, [sig]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  const hits = open ? cache.get(open) || [] : [];
  return (
    <>
      {parts.map((part, i) => {
        if (!(i % 2)) return part.replace(/\*\*/g, '');
        const k = part.trim();
        const linked = (cache.get(k) || []).length > 0;
        return linked ? (
          <button key={i} type="button" onClick={() => setOpen(k)} style={{ all: 'unset', cursor: 'pointer', color: 'var(--primary)', fontWeight: 800, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{part}</button>
        ) : (
          <b key={i} className="em" style={{ color: 'var(--primary)', fontWeight: 800 }}>{part}</b>
        );
      })}
      {open && hits.length > 0 && (
        <span role="dialog" aria-label="단어장" onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <span onClick={e => e.stopPropagation()} style={{ display: 'block', width: '100%', maxWidth: 380, maxHeight: '70vh', overflowY: 'auto', background: 'var(--white)', color: 'var(--text)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 8px 30px rgba(0,0,0,.25)', fontWeight: 400, lineHeight: 1.5 }}>
            {hits.map((h, i) => (
              <span key={i} style={{ display: 'block', padding: i ? '10px 0 0' : 0, marginTop: i ? 10 : 0, borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 8px' }}>
                  <b style={{ fontSize: 17 }}>{h.term}</b>
                  {h.englishTerm && <span style={{ fontSize: 13, color: 'var(--sub-text)' }}>{h.englishTerm}</span>}
                </span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 14 }}>{h.definition}</span>
                <Link href={`/quiz?subject=${encodeURIComponent(h.subject)}&q=${encodeURIComponent(h.term)}`} style={{ display: 'inline-block', marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  단어장에서 보기 &rarr;
                </Link>
              </span>
            ))}
          </span>
        </span>
      )}
    </>
  );
}
