import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasEhrAccess } from '@/lib/ehr-access';
import { getCase, saveCase } from '@/lib/ehr';
import { migrate } from '@/app/ehr/types';
import { applyPda } from '@/app/ehr/pda';

async function approvedUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await hasEhrAccess(user)) ? user : null;
}

// PDA·PC가 차트를 읽는다. ?events=1 이면 수행 이벤트만 돌려준다.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const row = await getCase(user.id, id);
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const data = migrate(row.data);
  if (new URL(req.url).searchParams.get('events')) return NextResponse.json({ pda: data.pda });
  return NextResponse.json({ title: row.title, subject: row.subject, data });
}

// PDA에서 투약을 수행하면 서버가 차트에 바로 반영한다 (PC가 저장하는 중이어도 PUT에서 다시 합쳐진다).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ev = body?.event as Record<string, string> | undefined;
  if (!ev || typeof ev.id !== 'string' || ev.type !== 'give') return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const clean: Record<string, string> = {};
  for (const k of ['id', 'type', 'idx', 'name', 'date', 'time', 'duty', 'by']) clean[k] = String(ev[k] ?? '').slice(0, 120);
  const row = await getCase(user.id, id);
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const data = applyPda(migrate(row.data), clean);
  const ok = await saveCase(user.id, id, row.title, row.subject, data);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
