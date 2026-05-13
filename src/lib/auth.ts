import { cookies } from 'next/headers';
import { encrypt, decrypt } from './auth-core';

export async function login(user: { id: string; studentId: string; role: string; name: string }) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ user, expires });

  (await cookies()).set('session', session, { expires, httpOnly: true });
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
