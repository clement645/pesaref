import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import type { UserStatus } from '@prisma/client';

const noopCtx = { ipAddress: null, userAgent: null };
export { noopCtx };

function unique(prefix: string): string {
  return `${prefix}${randomUUID().replace(/-/g, '')}`;
}

export async function resetDatabase(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();
}

export async function createTestUser(params: {
  status?: UserStatus;
  referredById?: string;
  referralCode?: string;
}): Promise<{ id: string; referralCode: string; phone: string; email: string }> {
  const id = unique('u');
  const referralCode = params.referralCode ?? unique('REF').toUpperCase().slice(0, 12);
  const phoneDigits = randomUUID().replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
  const phone = `2547${phoneDigits}`;
  const email = `${id}@example.com`;

  const user = await prisma.user.create({
    data: {
      fullName: `Test User ${id}`,
      email,
      phone,
      passwordHash: await hashPassword('Password123!'),
      status: params.status ?? 'ACTIVE',
      referralCode,
      referredById: params.referredById,
    },
  });

  await prisma.wallet.create({ data: { userId: user.id } });

  return { id: user.id, referralCode, phone, email };
}

export async function getWallet(userId: string) {
  return prisma.wallet.findUniqueOrThrow({ where: { userId } });
}
