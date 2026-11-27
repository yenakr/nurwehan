import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { listClasses, listSkillScns } from '@/lib/ehr-class';
import { cleanCfg } from '@/app/ehr/skills/scn';
import SkillsAdmin from './SkillsAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminSkillsPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr/skills');
  const [rows, classes] = await Promise.all([listSkillScns(), listClasses()]);
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 16 }}>
          <Link href="/admin/ehr" style={{ color: 'inherit' }}>← EHR</Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>핵심술기 시나리오 출제</h1>
        </div>
        <SkillsAdmin
          rows={rows.map(r => ({ id: r.id, published: r.published, classId: r.classId, skill: r.data.skill, title: r.data.title, exam: !!r.data.exam, assign: r.data.assign === 'random' ? 'random' : 'same', cfg: cleanCfg(r.data.cfg, r.data.skill) }))}
          classes={classes.map(c => ({ id: c.id, label: `${c.year}-${c.term} ${c.subject} ${c.grade}-${c.section}` }))}
        />
      </div>
    </main>
  );
}
