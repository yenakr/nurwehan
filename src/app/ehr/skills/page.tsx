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
        <p style={{ margin: '0 0 18px', color: 'var(--muted-foreground)', fontSize: 14 }}>술기는 실제로 연습하고, 수행 내용을 EHR에 기록해요. 모두 가상 환자입니다.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {SKILLS.map(s => (
            <Link key={s.key} href={`/ehr/skills/${s.key}`} style={{ display: 'block', padding: 16, borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                            <div style={{ fontSize: 13 }}>{s.goal}</div>
            </Link>
          ))}
        </div>
        {custom.length > 0 && (
          <>
            <h2 style={{ margin: '22px 0 8px', fontSize: 16 }}>교수님 출제</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {custom.map(c => (
                <Link key={c.id} href={`/ehr/skills/${c.id}`} style={{ display: 'block', padding: 16, borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.data.title}{c.data.exam && <span style={{ marginLeft: 8, fontSize: 11, background: '#dc2626', color: '#fff', borderRadius: 999, padding: '1px 8px' }}>시험</span>}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{SKILLS.find(s => s.key === c.data.skill)?.title}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
