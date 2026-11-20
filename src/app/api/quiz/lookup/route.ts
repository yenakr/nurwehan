import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hiddenSubjectsFor } from '@/lib/access';
import { guestAllowed } from '@/lib/quiz-gate';

// AI 답변 속 키워드가 단어장에 있는지 찾는다. ?q=키워드1|키워드2 (최대 8개)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user && !(await guestAllowed())) return NextResponse.json({ found: {} }, { status: 401 });
    const raw = new URL(req.url).searchParams.get('q') || '';
    const keys = Array.from(new Set(raw.split('|').map(k => k.trim()).filter(k => k.length >= 2 && k.length <= 60))).slice(0, 8);
    if (!keys.length) return NextResponse.json({ found: {} });

    const hidden = await hiddenSubjectsFor(user);
    const base: any = { itemType: 'TERM' };
    if (hidden.length > 0) base.subject = { notIn: hidden };

    const found: Record<string, { subject: string; term: string; englishTerm: string | null; definition: string }[]> = {};
    await Promise.all(keys.map(async k => {
      const rows = await prisma.nursingTerm.findMany({
        where: {
          ...base,
          OR: [
            { term: { equals: k, mode: 'insensitive' } },
            { englishTerm: { equals: k, mode: 'insensitive' } },
            { definition: { equals: k, mode: 'insensitive' } },
            ...(k.length >= 3 ? [{ definition: { contains: k, mode: 'insensitive' as const } }, { englishTerm: { contains: k, mode: 'insensitive' as const } }] : []),
          ],
        },
        select: { subject: true, term: true, englishTerm: true, definition: true },
        take: 30,
      }).catch(() => []);
      const lk = k.toLowerCase();
      const score = (r: { term: string; englishTerm: string | null; definition: string }) =>
        r.term.toLowerCase() === lk || (r.englishTerm || '').toLowerCase() === lk || r.definition.toLowerCase() === lk ? 0 : 1;
      const list = rows.sort((a, b) => score(a) - score(b)).slice(0, 4);
      if (list.length) found[k] = list;
    }));
    return NextResponse.json({ found });
  } catch {
    return NextResponse.json({ found: {} });
  }
}
