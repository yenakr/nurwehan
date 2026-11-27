import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess, EHR_FEEDBACK_LIMIT } from '@/lib/ehr-access';
import { notFound, redirect } from 'next/navigation';
import { aiConfigured } from '@/lib/ai';
import { aiQuotaLeft } from '@/lib/practicum-ai';
import { scenarioOf } from '../data';
import SkillRunner from '../SkillRunner';

export const dynamic = 'force-dynamic';
export const metadata = { title: '핵심술기별 EHR' };

export default async function SkillPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/ehr/skills/${key}`);
  if (!(await hasEhrAccess(user))) notFound();
  if (!scenarioOf(key)) notFound();
  const ai = aiConfigured();
  const left = ai ? await aiQuotaLeft(user.id, '#ehrskill', EHR_FEEDBACK_LIMIT) : 0;
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '20px 0' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <SkillRunner skillKey={key} ai={ai} aiLeft={left} />
      </div>
    </main>
  );
}
