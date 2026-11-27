import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { listCases } from '@/lib/ehr';
import { notFound, redirect } from 'next/navigation';
import { scenarioOf } from '../data';
import SkillStart from '../SkillStart';

export const dynamic = 'force-dynamic';
export const metadata = { title: '핵심술기별 EHR' };

export default async function SkillPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/ehr/skills/${key}`);
  if (!(await hasEhrAccess(user))) notFound();
  const sc = scenarioOf(key);
  if (!sc) notFound();
  const tries = (await listCases(user.id, 'skill')).filter(c => c.sampleKey === `sk:${key}`).map(c => ({ id: c.id, at: new Date(c.updatedAt).toISOString() }));
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <p style={{ margin: '0 0 6px' }}><Link href="/ehr/skills">← 핵심술기 목록</Link></p>
        <SkillStart skillKey={key} tries={tries} />
      </div>
    </main>
  );
}
