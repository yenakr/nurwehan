import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { getCase, removeCase, saveCase } from '@/lib/ehr';
import { migrate, type ChartData } from '@/app/ehr/types';
import { applyPda } from '@/app/ehr/pda';

async function approvedUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await hasEhrAccess(user)) ? user : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === 'string' ? body.title.slice(0, 100) : '새 차트';
  const subject = typeof body?.subject === 'string' ? body.subject.slice(0, 50) : null;
  let data = body?.data && typeof body.data === 'object' ? body.data : {};
  if (JSON.stringify(data).length > 400_000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  // PDA가 그 사이 서버에 남긴 수행 기록이 PC 저장으로 사라지지 않도록 다시 합친다
  const prev = await getCase(user.id, id);
  if (prev) {
    const stored = migrate(prev.data).pda;
    const have = new Set(((data as { pda?: { id: string }[] }).pda || []).map(e => e.id));
    const missing = stored.filter(e => !have.has(e.id));
    if (missing.length) data = missing.reduce((acc: ChartData, e) => applyPda(acc, e), migrate(data));
  }
  const ok = await saveCase(user.id, id, title, subject, data);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const ok = await removeCase(user.id, id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
