import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/auth-core';
import { appendVitals } from '@/lib/ehr';

const KEYS = ['time', 'bp', 'hr', 'rr', 'bt', 'spo2', 'pain'];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !(user.approvalStatus === 'APPROVED' || isAdminRole(user.role))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const list = Array.isArray(body?.items) ? body.items.slice(0, 40) : [];
  const items = list
    .map((x: { id?: unknown; row?: Record<string, unknown> }) => ({
      id: typeof x?.id === 'string' ? x.id : '',
      row: Object.fromEntries(KEYS.map(k => [k, typeof x?.row?.[k] === 'string' ? (x.row[k] as string).slice(0, 20) : ''])),
    }))
    .filter((x: { id: string; row: Record<string, string> }) => x.id && KEYS.slice(1).some(k => x.row[k]));
  const n = await appendVitals(user.id, items);
  return NextResponse.json({ n });
}
