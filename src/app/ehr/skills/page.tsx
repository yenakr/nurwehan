import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { notFound, redirect } from 'next/navigation';
import { isExamUser } from '@/lib/ehr-skill';
import { studentSkillScns } from '@/lib/ehr-class';
import { SKILLS } from './scn';

export const dynamic = 'force-dynamic';
export const metadata = { title: '핵심술기별 EHR' };

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr/skills');
  if (!(await hasEhrAccess(user))) notFound();
  if (isExamUser(user)) redirect('/ehr/exam');
  const custom = (await studentSkillScns(user.id)).filter(c => !c.data.exam);
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        <p style={{ margin: '0 0 6px' }}><Link href="/ehr">← EHR 선택</Link></p>
        <h1 style={{ margin: '0 0 6px', fontSize: 22 }}>핵심술기별 EHR</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10, marginTop: 16 }}>
          {SKILLS.map((s, i) => (
            <Link key={s.key} href={`/ehr/skills/${s.key}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 16px', borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: 13, minWidth: 18 }}>{i + 1}</span>{s.title}
            </Link>
          ))}
        </div>
        {custom.length > 0 && (
          <>
            <h2 style={{ margin: '22px 0 8px', fontSize: 16 }}>교수님 출제</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
              {custom.map(c => (
                <Link key={c.id} href={`/ehr/skills/${c.id}`} style={{ display: 'block', padding: '14px 16px', borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontWeight: 700 }}>{c.data.title}{c.data.exam && <span style={{ marginLeft: 8, fontSize: 11, background: '#dc2626', color: '#fff', borderRadius: 999, padding: '1px 8px' }}>시험</span>}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
