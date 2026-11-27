import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { hasEhrAccess } from '@/lib/ehr-access';
import { listSkillScns } from '@/lib/ehr-class';
import { isExamUser } from '@/lib/ehr-skill';
import { notFound, redirect } from 'next/navigation';
import { SKILLS } from '../skills/scn';
import ExamEntry from './ExamEntry';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: '핵심술기 수행평가' };

export default async function ExamPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/ehr/exam');
  if (!(await hasEhrAccess(user)) || !(isExamUser(user) || isAdminRole(user.role))) notFound();
  const list = (await listSkillScns()).filter(r => r.published && r.data.exam).map(r => ({ id: r.id, title: r.data.title, skill: SKILLS.find(s => s.key === r.data.skill)?.title || '' }));
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', display: 'grid', alignItems: 'center', padding: '28px 0' }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <ExamEntry list={list} />
        <div style={{ textAlign: 'center', marginTop: 14 }}><LogoutButton /></div>
      </div>
    </main>
  );
}
