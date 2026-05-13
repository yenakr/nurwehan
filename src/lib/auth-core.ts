import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const secretKey = 'nur-uihan-secret-key-change-me-in-prod';
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

export async function decrypt(input: string): Promise<AuthSession> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as AuthSession;
}
