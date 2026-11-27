import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { listClasses, listSkillScns } from '@/lib/ehr-class';
import { listExamCases } from '@/lib/ehr';
import { cleanCfg } from '@/app/ehr/skills/scn';
import SkillsAdmin from './SkillsAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminSkillsPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) redirect('/login?redirect=/admin/ehr/skills');
  const [rows, classes, exams] = await Promise.all([listSkillScns(), listClasses(), listExamCases()]);
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
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '28px 0 6px' }}>시험 응시 현황</h2>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--muted-foreground)' }}>시험용 공용 계정(학번이 EXAM으로 시작하는 계정, EHR 권한 필요)으로 /ehr/exam 에서 학번·이름을 입력해 응시해요. 제출한 차트만 열어 볼 수 있어요.</p>
        <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {exams.length === 0 && <p style={{ margin: 0, padding: 16, color: 'var(--muted-foreground)' }}>응시 기록이 없어요.</p>}
          {exams.map(e => {
            const t = rows.find(r => r.id === e.scn)?.data.title || '';
            const row = (
              <>
                <span style={{ width: 110 }}>{e.examNo}</span><b style={{ width: 90 }}>{e.examName}</b><span style={{ flex: 1, color: 'var(--muted-foreground)' }}>{t}</span>
                <span style={{ width: 70, textAlign: 'right' }}>{e.score || '-'}</span><span style={{ width: 80, textAlign: 'right', color: e.submitted ? '#16a34a' : '#b45309' }}>{e.submitted ? '제출' : '진행 중'}</span>
              </>
            );
            const st = { display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'inherit' } as const;
            return e.submitted ? <Link key={e.id} href={`/admin/ehr/${e.id}`} style={st}>{row}</Link> : <div key={e.id} style={st}>{row}</div>;
          })}
        </div>
      </div>
    </main>
  );
}
