'use client';

export default function PrintBtn() {
  return <button type="button" onClick={() => window.print()} style={{ marginLeft: 'auto', border: 0, borderRadius: 999, padding: '8px 18px', background: 'var(--primary)', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>인쇄</button>;
}
