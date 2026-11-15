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
  const clean: Record<string, Array<{ id: string; d: string; l: string; m?: string }>> = {};
  const notes: Record<string, string> = {};
  const raw = body?.data && typeof body.data === 'object' ? body.data : {};
  const src = raw.r && typeof raw.r === 'object' ? raw.r : {};
  for (const [k, v] of Object.entries(src)) {
    if (!ids.has(k) || !Array.isArray(v)) continue;
    const seen = new Set<string>();
    const recs: Array<{ id: string; d: string; l: string; m?: string }> = [];
    for (const x of v as Array<Record<string, unknown>>) {
      if (typeof x?.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.d)) continue;
      if (x.l !== 'O' && x.l !== 'P' && x.l !== 'D') continue;
      let id = typeof x.id === 'string' && /^[\w-]{1,40}$/.test(x.id) ? x.id : `${x.d}-${x.l}`;
      while (seen.has(id)) id += '_';
      seen.add(id);
      const m = typeof x.m === 'string' ? x.m.slice(0, 200) : '';
      recs.push({ id, d: x.d, l: x.l, ...(m ? { m } : {}) });
      if (recs.length >= 200) break;
    }
    if (recs.length) clean[k] = recs;
  }
  const nsrc = raw.n && typeof raw.n === 'object' ? raw.n : {};
  for (const [k, v] of Object.entries(nsrc)) {
    if (ids.has(k) && typeof v === 'string' && v.trim()) notes[k] = v.slice(0, 200);
  }
  const ok = await saveProgress(user.id, subject, { r: clean, n: notes });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
