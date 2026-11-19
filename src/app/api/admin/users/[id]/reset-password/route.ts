import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/auth-core';

// 헷갈리는 글자(0 O 1 l I)를 뺀 문자만 쓴다
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeTemp = () => Array.from({ length: 10 }, () => CHARS[randomInt(CHARS.length)]).join('');

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser();
    if (!me || !isAdminRole(me.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }
    const { id } = await params;
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    if (!isSuperAdmin(me.role) && isAdminRole(target.role)) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }
    const temp = makeTemp();
    await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(temp, 10) } });
    // 임시 비밀번호는 이 응답에서만 보여 주고 어디에도 저장하지 않는다
    return NextResponse.json({ password: temp });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
