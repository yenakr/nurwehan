import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const current = String(body?.current ?? '');
    const next = String(body?.next ?? '');
    if (next.length < 8 || next.length > 100) {
      return NextResponse.json({ message: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: me.id }, select: { password: true } });
    if (!user || !(await bcrypt.compare(current, user.password))) {
      return NextResponse.json({ message: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }
    await prisma.user.update({ where: { id: me.id }, data: { password: await bcrypt.hash(next, 10) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
