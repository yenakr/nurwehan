import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const category = searchParams.get('category');

    const where: any = {};
    if (subject && subject !== 'all') {
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
      select: { subject: true, category: true },
    });

    const subjects = Array.from(new Set(allTerms.map(t => t.subject).filter(Boolean)));
    const categories = Array.from(new Set(allTerms.map(t => t.category).filter(Boolean)));

    return NextResponse.json({ terms, subjects, categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}
