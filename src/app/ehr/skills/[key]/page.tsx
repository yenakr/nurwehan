import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { hasEhrAccess } from '@/lib/ehr-access';
import { listCases } from '@/lib/ehr';
import { resolveScn, isExamUser } from '@/lib/ehr-skill';
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
  if (isExamUser(user)) redirect('/ehr/exam');
  const sc = await resolveScn(key, user.id, isAdminRole(user.role));
  if (!sc) return notFound();
  const sk = `sk:${sc.skill}:${sc.scnId || 'def'}`;
  const tries = (await listCases(user.id, 'skill')).filter(c => c.sampleKey === sk).map(c => ({ id: c.id, at: new Date(c.updatedAt).toISOString(), done: !!c.submitted }));
  const base = scenarioOf(sc.skill)!;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <p style={{ margin: '0 0 6px' }}><Link href="/ehr/skills">← 핵심술기 목록</Link></p>
        <SkillStart startKey={key} skill={sc.skill} title={sc.title} goal={base.goal} exam={sc.exam} custom={!!sc.scnId} patient={`${sc.cfg.name} · ${sc.cfg.age}/${sc.cfg.sex} · ${sc.cfg.dx} · 알레르기 ${sc.cfg.allergy}`} tries={tries} />
      </div>
    </main>
  );
}
