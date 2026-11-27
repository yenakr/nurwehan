import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { createCase } from '@/lib/ehr';
import { buildSkillChart } from '@/app/ehr/skills/charts';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(await hasEhrAccess(user))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const built = buildSkillChart(String(b?.key || ''));
  if (!built) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const id = await createCase(user.id, built.title, '핵심술기', built.data);
  return id ? NextResponse.json({ id }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
