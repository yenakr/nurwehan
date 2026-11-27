import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { notFound, redirect } from 'next/navigation';
import { SCENARIOS } from './data';

export const dynamic = 'force-dynamic';
export const metadata = { title: '핵심술기별 EHR' };

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr/skills');
  if (!(await hasEhrAccess(user))) notFound();
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        <p style={{ margin: '0 0 6px' }}><Link href="/ehr">← EHR(프로그램 연습)</Link></p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22 }}>핵심술기별 EHR</h1>
        <p style={{ margin: '0 0 18px', color: 'var(--muted-foreground)', fontSize: 14 }}>술기 하나를 순서대로 연습하고 체크리스트로 채점받아요. 모두 가상 환자입니다.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {SCENARIOS.map(s => (
            <Link key={s.key} href={`/ehr/skills/${s.key}`} style={{ display: 'block', padding: 16, borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '2px 0 6px' }}>{s.sub}</div>
              <div style={{ fontSize: 13 }}>{s.goal}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
