import type { ReactNode } from 'react';

// 간호메모의 굵게(**글**)와 형광펜(==글==) 표시를 화면용으로 바꾼다
export function Rich({ text }: { text: string }) {
  const parts = (text || '').split(/(\*\*[^*]+\*\*|==[^=]+==)/g);
  return (
    <>
      {parts.map((p, i): ReactNode => {
        if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <b key={i}>{p.slice(2, -2)}</b>;
        if (p.startsWith('==') && p.endsWith('==') && p.length > 4) return <mark key={i} style={{ background: '#fde68a', color: 'inherit' }}>{p.slice(2, -2)}</mark>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
