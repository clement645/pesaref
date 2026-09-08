import 'server-only';
import { prisma } from '@/lib/db';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_IDENTIFIER = 5;

/**
 * DB-backed rate limiting: serverless functions on Netlify have no shared
 * in-memory state between invocations, so limits must be persisted.
 */
export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const recentFailures = await prisma.loginAttempt.count({
    where: { identifier, success: false, createdAt: { gte: windowStart } },
  });

  if (recentFailures >= MAX_ATTEMPTS_PER_IDENTIFIER) {
    return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(params: {
  identifier: string;
  success: boolean;
  userId?: string;
  ipAddress?: string | null;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      identifier: params.identifier,
      success: params.success,
      userId: params.userId,
      ipAddress: params.ipAddress ?? undefined,
    },
  });
}
