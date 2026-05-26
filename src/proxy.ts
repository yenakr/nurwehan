import { NextRequest, NextResponse } from 'next/server';
import { decrypt, isAdminRole } from './lib/auth-core';

const protectedRoutes = ['/history', '/mypage', '/admin'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (!isProtectedRoute) return NextResponse.next();

  const cookie = req.cookies.get('session')?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL(`/login?redirect=${path}`, req.url));
  }

  try {
    const session = await decrypt(cookie);
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/login?redirect=${path}`, req.url));
    }

    // Admin route protection
    if (path.startsWith('/admin')) {
      if (!isAdminRole(session.user.role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(`/login?redirect=${path}`, req.url));
  }
}

export const config = {
  matcher: ['/history/:path*', '/mypage/:path*', '/admin/:path*'],
};
