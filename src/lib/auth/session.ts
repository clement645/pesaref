import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, signSessionToken, verifySessionToken } from './jwt';
import type { Role, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  referralCode: string;
}

export async function createSession(userId: string, role: Role): Promise<void> {
  const token = await signSessionToken({ sub: userId, role });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  cookies().set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

/**
 * Fetches the current user fresh from the database on every call (cached
 * per-request via React `cache`), so a SUSPENDED/DEACTIVATED status change
 * takes effect immediately rather than waiting for the JWT to expire.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      referralCode: true,
    },
  });

  return user;
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('UNAUTHENTICATED');
  if (user.status === 'DEACTIVATED') throw new AuthError('FORBIDDEN');
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') throw new AuthError('FORBIDDEN');
  return user;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN') throw new AuthError('FORBIDDEN');
  return user;
}

export class AuthError extends Error {
  constructor(public code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(code);
    this.name = 'AuthError';
  }
}
