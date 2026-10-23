import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// 운영에서는 Vercel 환경변수 AUTH_SECRET(32자 이상 무작위 문자열)을 반드시 설정해야 한다.
// 설정 전에는 기존 값으로 동작하지만, 이 값은 공개 코드에 있으므로 안전하지 않다.
const secretKey = process.env.AUTH_SECRET || 'nur-uihan-secret-key-change-me-in-prod';
const key = new TextEncoder().encode(secretKey);

export interface AuthUser {
  id: string;
  studentId: string;
  role: string;
  name: string;
  grade?: number;
}

export interface AuthSession extends JWTPayload {
  user: AuthUser;
  expires: string | number | Date;
}

export async function encrypt(payload: AuthSession) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

export async function decrypt(input: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as AuthSession;
  } catch (err) {
    console.error('Session decryption failed:', err);
    return null;
  }
}

export function isAdminRole(role?: string | null) {
  if (!role) return false;
  const upperRole = role.toUpperCase();
  return upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN' || upperRole === 'ASSISTANT';
}
