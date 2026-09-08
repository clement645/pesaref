import 'server-only';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { normalizeKenyanPhone } from '@/lib/utils/phone';
import { generateReferralCodeCandidate } from '@/lib/utils/referral-code';
import { writeAuditLog } from '@/lib/services/audit.service';
import { createNotification } from '@/lib/services/notification.service';
import type { AuditContext } from '@/lib/services/audit.service';

export class RegistrationError extends Error {
  constructor(public field: 'email' | 'phone' | 'referralCode' | 'general', message: string) {
    super(message);
    this.name = 'RegistrationError';
  }
}

async function generateUniqueReferralCode(fullName: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateReferralCodeCandidate(fullName);
    const existing = await prisma.user.findUnique({ where: { referralCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate a unique referral code after several attempts');
}

export async function registerUser(
  params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    referralCode?: string;
  },
  ctx: AuditContext
): Promise<{ userId: string }> {
  const normalizedPhone = normalizeKenyanPhone(params.phone);
  if (!normalizedPhone) {
    throw new RegistrationError('phone', 'Enter a valid Kenyan phone number');
  }
  const normalizedEmail = params.email.trim().toLowerCase();

  const [existingEmail, existingPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail } }),
    prisma.user.findUnique({ where: { phone: normalizedPhone } }),
  ]);
  if (existingEmail) throw new RegistrationError('email', 'An account with this email already exists');
  if (existingPhone) throw new RegistrationError('phone', 'An account with this phone number already exists');

  let referrer: { id: string; status: string } | null = null;
  const trimmedCode = params.referralCode?.trim().toUpperCase();
  if (trimmedCode) {
    referrer = await prisma.user.findUnique({
      where: { referralCode: trimmedCode },
      select: { id: true, status: true },
    });
    if (!referrer) {
      throw new RegistrationError('referralCode', 'Referral code is not valid');
    }
  }

  const passwordHash = await hashPassword(params.password);
  const referralCode = await generateUniqueReferralCode(params.fullName);

  const userId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: params.fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        referralCode,
        referredById: referrer?.id,
        status: 'PENDING_PAYMENT',
      },
      select: { id: true },
    });

    await tx.wallet.create({
      data: { userId: user.id },
    });

    if (referrer) {
      // A referred user cannot refer themselves - guaranteed structurally
      // since referrer already existed before this user was created.
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: user.id,
          referralCodeUsed: trimmedCode!,
          status: 'REGISTERED',
        },
      });
    }

    await createNotification(tx, {
      userId: user.id,
      type: 'REGISTRATION_COMPLETED',
      title: 'Welcome to PesaRef',
      message: 'Your account has been created. Complete your registration payment to activate it.',
    });

    await writeAuditLog(tx, {
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      newValue: { email: normalizedEmail, phone: normalizedPhone, referredById: referrer?.id },
      ...ctx,
    });

    return user.id;
  });

  return { userId };
}

export function preventSelfReferral(referrerId: string, referredId: string): void {
  if (referrerId === referredId) {
    throw new RegistrationError('referralCode', 'You cannot refer yourself');
  }
}
