import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hiddenSubjectsFor } from '@/lib/access';
import { normalizeTerm } from '@/lib/quiz/taxonomy';
import { guestAllowed } from '@/lib/quiz-gate';

export async function GET(req: Request) {
  try {
    const current = await getCurrentUser();
    if (!current && !(await guestAllowed())) {
      return NextResponse.json({ terms: [], subjects: [], categories: [] }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const category = searchParams.get('category');

    const hidden = await hiddenSubjectsFor(current);
    const where: any = hidden.length > 0 ? { subject: { notIn: hidden } } : {};
    if (subject && subject !== 'all') {
      if (hidden.includes(subject)) return NextResponse.json({ terms: [], subjects: [], categories: [] });
      where.subject = subject;
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const terms = await prisma.nursingTerm.findMany({
      where,
      orderBy: [{ subject: 'asc' }, { category: 'asc' }, { term: 'asc' }],
    });

    // Extract unique subjects and categories
    const allTerms = await prisma.nursingTerm.findMany({
      where: hidden.length > 0 ? { subject: { notIn: hidden } } : undefined,
      select: { subject: true, category: true },
    });

    const subjects = Array.from(new Set(allTerms.map(t => t.subject).filter(Boolean)));
    const categories = Array.from(new Set(allTerms.map(t => t.category).filter(Boolean)));

    return NextResponse.json({ terms: terms.map(normalizeTerm), subjects, categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}
