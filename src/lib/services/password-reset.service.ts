import 'server-only';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { writeAuditLog, type AuditContext } from '@/lib/services/audit.service';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Always returns a token even if the email is unknown - callers must show a
 * generic "if this email exists" message to avoid leaking account
 * existence. Returns null when no account exists.
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;

  const token = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return token;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
  ctx: AuditContext
): Promise<{ success: true } | { success: false; error: string }> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { success: false, error: 'This password reset link is invalid or has expired' };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await writeAuditLog(tx, {
      actorId: record.userId,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: record.userId,
      ...ctx,
    });
  });

  return { success: true };
}
