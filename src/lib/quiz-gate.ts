import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'qg';

function expected(): string | null {
  const code = process.env.QUIZ_ACCESS_CODE;
  if (!code) return null;
  const secret = process.env.AUTH_SECRET || 'nur-uihan-secret-key-change-me-in-prod';
  return createHmac('sha256', secret).update(`gate:${code}`).digest('hex');
}

// 환경변수가 없으면 막지 않는다(설정 전 접속 불가 방지)
export function gateEnabled(): boolean {
  return !!process.env.QUIZ_ACCESS_CODE;
}

export function codeMatches(input: string): boolean {
  const code = process.env.QUIZ_ACCESS_CODE;
  if (!code) return true;
  const a = Buffer.from(input);
  const b = Buffer.from(code);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hasGatePass(): Promise<boolean> {
  const want = expected();
  if (!want) return true;
  const got = (await cookies()).get(COOKIE)?.value;
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function grantGatePass(): Promise<void> {
  const value = expected();
  if (!value) return;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
}
