import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { getFavoriteIds, setFavorite } from '@/lib/favorites';

async function approvedUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.approvalStatus === 'APPROVED' || isAdminRole(user.role) ? user : null;
}

export async function GET() {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ ids: [] });
  return NextResponse.json({ ids: await getFavoriteIds(user.id) });
}

export async function POST(req: Request) {
  const user = await approvedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const termId = typeof body?.termId === 'string' ? body.termId.slice(0, 100) : '';
  if (!termId) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const ok = await setFavorite(user.id, termId, !!body?.on);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'failed' }, { status: 500 });
}
