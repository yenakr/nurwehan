import { NextResponse } from 'next/server';
import { codeMatches, grantGatePass } from '@/lib/quiz-gate';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? '').trim().slice(0, 50);
  // 무작위 대입을 늦추기 위한 지연
  await new Promise(r => setTimeout(r, 700));
  if (!code || !codeMatches(code)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await grantGatePass();
  return NextResponse.json({ ok: true });
}
