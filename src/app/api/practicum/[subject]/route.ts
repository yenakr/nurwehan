import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { saveProgress } from '@/lib/practicum';
import { SUBJECTS } from '@/app/clinical/practicum-data';

export async function PUT(req: Request, { params }: { params: Promise<{ subject: string }> }) {
  const user = await getCurrentUser();
  if (!user || !(user.approvalStatus === 'APPROVED' || isAdminRole(user.role))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { subject } = await params;
  const sub = SUBJECTS.find(s => s.key === subject);
  if (!sub) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const ids = new Set(sub.groups.flatMap(g => g.items.map(i => i.id)));
  const clean: Record<string, Array<{ d: string; l: string }>> = {};
  const src = body?.data && typeof body.data === 'object' ? body.data : {};
  for (const [k, v] of Object.entries(src)) {
    if (!ids.has(k) || !Array.isArray(v)) continue;
    const recs = v
      .filter((r: unknown): r is { d: string; l: string } => {
        const x = r as { d?: unknown; l?: unknown };
        return typeof x?.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.d) && (x.l === 'O' || x.l === 'P' || x.l === 'D');
      })
      .slice(0, 60);
    if (recs.length) clean[k] = recs;
  }
  const ok = await saveProgress(user.id, subject, clean);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
