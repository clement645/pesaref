import 'server-only';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { writeAuditLog, type AuditContext } from '@/lib/services/audit.service';
import { createNotification } from '@/lib/services/notification.service';
import { applyAvailableBalanceChange } from '@/lib/services/wallet.service';
import { getRegistrationFee, getReferralCommission } from '@/lib/services/settings.service';
import { normalizeKenyanPhone } from '@/lib/utils/phone';

export class PaymentError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export async function submitPayment(
  params: { userId: string; paymentReference: string; paymentPhone: string; paymentDate: string },
  ctx: AuditContext
): Promise<{ paymentId: string }> {
  const normalizedPhone = normalizeKenyanPhone(params.paymentPhone);
  if (!normalizedPhone) throw new PaymentError('INVALID_PHONE', 'Enter a valid Kenyan phone number');

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new PaymentError('NOT_FOUND', 'User not found');
  if (user.status !== 'PENDING_PAYMENT') {
    throw new PaymentError('INVALID_STATE', 'Your account does not require a registration payment right now');
  }

  const existingPending = await prisma.payment.findFirst({
    where: { userId: user.id, status: 'PENDING' },
  });
  if (existingPending) {
    throw new PaymentError('DUPLICATE', 'You already have a payment awaiting review');
  }

  const amount = await getRegistrationFee();

  const paymentId = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        amount,
        paymentReference: params.paymentReference.trim(),
        paymentPhone: normalizedPhone,
        paymentDate: new Date(params.paymentDate),
        status: 'PENDING',
      },
    });

    await tx.referral.updateMany({
      where: { referredId: user.id, status: 'REGISTERED' },
      data: { status: 'PAYMENT_PENDING' },
    });

    await createNotification(tx, {
      userId: user.id,
      type: 'PAYMENT_SUBMITTED',
      title: 'Payment submitted',
      message: 'Your registration payment has been submitted and is pending verification by our team.',
    });

    await writeAuditLog(tx, {
      actorId: user.id,
      action: 'PAYMENT_SUBMITTED',
      entityType: 'Payment',
      entityId: payment.id,
      newValue: { amount, paymentReference: payment.paymentReference },
      ...ctx,
    });

    return payment.id;
  });

  return { paymentId };
}

export async function approvePayment(
  params: { paymentId: string; adminId: string; adminNote?: string },
  ctx: AuditContext
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [payment] = await tx.$queryRaw<Array<{ id: string; status: string; userId: string }>>`
      SELECT id, status, "userId" FROM "Payment" WHERE id = ${params.paymentId} FOR UPDATE
    `;
    if (!payment) throw new PaymentError('NOT_FOUND', 'Payment not found');
    if (payment.status !== 'PENDING') {
      throw new PaymentError('ALREADY_PROCESSED', 'This payment has already been reviewed');
    }

    const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        reviewedById: params.adminId,
        reviewedAt: new Date(),
        adminNote: params.adminNote || undefined,
      },
    });

    if (user.status === 'PENDING_PAYMENT') {
      await tx.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
    }

    await createNotification(tx, {
      userId: user.id,
      type: 'PAYMENT_APPROVED',
      title: 'Payment approved',
      message: 'Your registration payment has been verified. Your account is now active.',
    });

    await writeAuditLog(tx, {
      actorId: params.adminId,
      action: 'PAYMENT_APPROVED',
      entityType: 'Payment',
      entityId: payment.id,
      oldValue: { status: 'PENDING' },
      newValue: { status: 'APPROVED' },
      ...ctx,
    });

    await maybeCreateReferralCommission(tx, { referredUserId: user.id, qualifyingPaymentId: payment.id }, ctx);
  });
}

async function maybeCreateReferralCommission(
  tx: Prisma.TransactionClient,
  params: { referredUserId: string; qualifyingPaymentId: string },
  ctx: AuditContext
): Promise<void> {
  const referral = await tx.referral.findUnique({ where: { referredId: params.referredUserId } });
  if (!referral) return; // this user was not referred by anyone

  // Idempotency guard: never create a second commission for the same referral.
  if (referral.status === 'COMMISSIONED' || referral.qualifyingPaymentId) return;

  const referrer = await tx.user.findUniqueOrThrow({ where: { id: referral.referrerId } });

  if (referrer.status !== 'ACTIVE') {
    // Referrer suspended/deactivated/pending: mark payment as qualified but
    // withhold the commission. An ACTIVE-only re-check would be needed
    // before any future manual reconciliation.
    await tx.referral.update({
      where: { id: referral.id },
      data: { status: 'QUALIFIED', qualifyingPaymentId: params.qualifyingPaymentId },
    });
    await writeAuditLog(tx, {
      action: 'REFERRAL_COMMISSION_WITHHELD',
      entityType: 'Referral',
      entityId: referral.id,
      newValue: { reason: `Referrer status is ${referrer.status}` },
      ...ctx,
    });
    return;
  }

  const commissionAmount = await getReferralCommission();

  const { walletTransactionId } = await applyAvailableBalanceChange(tx, {
    userId: referrer.id,
    amount: commissionAmount,
    type: 'REFERRAL_COMMISSION',
    description: `Referral commission for referring a new activated member`,
    relatedReferralId: referral.id,
    incrementTotalEarned: true,
  });

  await tx.referral.update({
    where: { id: referral.id },
    data: {
      status: 'COMMISSIONED',
      qualifyingPaymentId: params.qualifyingPaymentId,
      commissionAmount,
      walletTransactionId,
    },
  });

  await createNotification(tx, {
    userId: referrer.id,
    type: 'COMMISSION_EARNED',
    title: 'Referral commission earned',
    message: `You earned a referral commission for a successful referral.`,
  });

  await writeAuditLog(tx, {
    action: 'REFERRAL_COMMISSIONED',
    entityType: 'Referral',
    entityId: referral.id,
    newValue: { commissionAmount, qualifyingPaymentId: params.qualifyingPaymentId },
    ...ctx,
  });
}

export async function rejectPayment(
  params: { paymentId: string; adminId: string; rejectionReason: string },
  ctx: AuditContext
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [payment] = await tx.$queryRaw<Array<{ id: string; status: string; userId: string }>>`
      SELECT id, status, "userId" FROM "Payment" WHERE id = ${params.paymentId} FOR UPDATE
    `;
    if (!payment) throw new PaymentError('NOT_FOUND', 'Payment not found');
    if (payment.status !== 'PENDING') {
      throw new PaymentError('ALREADY_PROCESSED', 'This payment has already been reviewed');
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REJECTED',
        reviewedById: params.adminId,
        reviewedAt: new Date(),
        rejectionReason: params.rejectionReason,
      },
    });

    await tx.referral.updateMany({
      where: { referredId: payment.userId, status: 'PAYMENT_PENDING' },
      data: { status: 'REGISTERED' },
    });

    await createNotification(tx, {
      userId: payment.userId,
      type: 'PAYMENT_REJECTED',
      title: 'Payment rejected',
      message: `Your registration payment could not be verified: ${params.rejectionReason}. Please submit a valid payment.`,
    });

    await writeAuditLog(tx, {
      actorId: params.adminId,
      action: 'PAYMENT_REJECTED',
      entityType: 'Payment',
      entityId: payment.id,
      oldValue: { status: 'PENDING' },
      newValue: { status: 'REJECTED', rejectionReason: params.rejectionReason },
      ...ctx,
    });
  });
}
