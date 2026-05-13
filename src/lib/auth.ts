import { cookies } from 'next/headers';
import { encrypt, decrypt, type AuthUser, type AuthSession } from './auth-core';
import { prisma } from './prisma';

export async function login(user: AuthUser) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ user, expires });

  (await cookies()).set('session', session, { expires, httpOnly: true });
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function getSession(): Promise<AuthSession | null> {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.user) return null;

    // Always fetch latest from DB to ensure roles/status are accurate
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        studentId: true,
        role: true,
        approvalStatus: true,
        grade: true,
        phone: true,
        email: true,
      }
    });

    return user;
  } catch (error) {
    console.error('GetCurrentUser error:', error);
    return null;
  }
}

import { redirect } from 'next/navigation';
import { isAdminRole } from './auth-core';

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    redirect('/admin'); // or /login?
  }
  return user;
}
