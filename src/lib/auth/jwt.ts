import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'pesaref_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // user id
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET environment variable is missing or too short. Set a strong random value.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') return null;
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(payload.role)) return null;
    return { sub: payload.sub, role: payload.role as SessionPayload['role'] };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
