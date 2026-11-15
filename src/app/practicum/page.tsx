import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAllProgress } from '@/lib/practicum';
import { SUBJECTS } from './data';

export const dynamic = 'force-dynamic';
export const metadata = { title: '실습 체크리스트' };

export default async function PracticumPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/practicum');
  const all = await getAllProgress(user.id);
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>실습 체크리스트</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          {SUBJECTS.map(s => {
            const total = s.groups.reduce((n, g) => n + g.items.length, 0);
            const prog = all[s.key] || {};
            const done = s.groups.reduce((n, g) => n + g.items.filter(i => Array.isArray(prog[i.id]) && (prog[i.id] as unknown[]).length > 0).length, 0);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <Link key={s.key} href={`/practicum/${s.key}`} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ fontSize: 16 }}>{s.title}</b>
                  <span style={{ fontSize: 13, color: 'var(--sub-text)' }}>{done} / {total}</span>
                </div>
                <div style={{ height: 6, background: '#EEF2F7', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
