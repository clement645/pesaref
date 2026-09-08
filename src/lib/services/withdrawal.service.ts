import 'server-only';
import { prisma } from '@/lib/db';
import { writeAuditLog, type AuditContext } from '@/lib/services/audit.service';
import { createNotification } from '@/lib/services/notification.service';
import { reserveForWithdrawal, releaseReservedWithdrawal, InsufficientBalanceError } from '@/lib/services/wallet.service';
import { getMinWithdrawal } from '@/lib/services/settings.service';
import { normalizeKenyanPhone } from '@/lib/utils/phone';

export class WithdrawalError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'WithdrawalError';
  }
}

export async function requestWithdrawal(
  params: { userId: string; amount: number; phone: string; note?: string },
  ctx: AuditContext
): Promise<{ withdrawalId: string }> {
  const normalizedPhone = normalizeKenyanPhone(params.phone);
  if (!normalizedPhone) throw new WithdrawalError('INVALID_PHONE', 'Enter a valid Kenyan phone number');
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new WithdrawalError('INVALID_AMOUNT', 'Enter a valid withdrawal amount');
  }

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new WithdrawalError('NOT_FOUND', 'User not found');
  if (user.status !== 'ACTIVE') {
    throw new WithdrawalError('NOT_ACTIVE', 'Only active accounts can request withdrawals');
  }

  const minWithdrawal = await getMinWithdrawal();
  if (params.amount < minWithdrawal) {
    throw new WithdrawalError('BELOW_MINIMUM', `Minimum withdrawal amount is KSh ${minWithdrawal.toLocaleString('en-KE')}`);
  }

  try {
    const withdrawalId = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount: params.amount,
          phone: normalizedPhone,
          note: params.note || undefined,
          status: 'PENDING',
        },
      });

      await reserveForWithdrawal(tx, { userId: user.id, amount: params.amount, withdrawalId: withdrawal.id });

      await createNotification(tx, {
        userId: user.id,
        type: 'WITHDRAWAL_SUBMITTED',
        title: 'Withdrawal requested',
        message: `Your withdrawal request of KSh ${params.amount.toLocaleString('en-KE')} has been submitted and is pending processing.`,
      });

      await writeAuditLog(tx, {
        actorId: user.id,
        action: 'WITHDRAWAL_REQUESTED',
        entityType: 'Withdrawal',
        entityId: withdrawal.id,
        newValue: { amount: params.amount, phone: normalizedPhone },
        ...ctx,
      });

      return withdrawal.id;
    });

    return { withdrawalId };
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      throw new WithdrawalError('INSUFFICIENT_BALANCE', 'Insufficient available balance for this withdrawal');
    }
    throw err;
  }
}

export async function markWithdrawalPaid(
  params: { withdrawalId: string; adminId: string; mpesaReference: string; adminNote?: string },
  ctx: AuditContext
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [withdrawal] = await tx.$queryRaw<Array<{ id: string; status: string; userId: string; amount: number }>>`
      SELECT id, status, "userId", amount FROM "Withdrawal" WHERE id = ${params.withdrawalId} FOR UPDATE
    `;
    if (!withdrawal) throw new WithdrawalError('NOT_FOUND', 'Withdrawal not found');
    if (withdrawal.status !== 'PENDING') {
      throw new WithdrawalError('ALREADY_PROCESSED', 'This withdrawal has already been processed');
    }

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'PAID',
        mpesaReference: params.mpesaReference,
        adminNote: params.adminNote || undefined,
        processedById: params.adminId,
        processedAt: new Date(),
      },
    });

    await releaseReservedWithdrawal(tx, {
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      withdrawalId: withdrawal.id,
      asPaid: true,
    });

    await createNotification(tx, {
      userId: withdrawal.userId,
      type: 'WITHDRAWAL_APPROVED',
      title: 'Withdrawal paid',
      message: `Your withdrawal of KSh ${withdrawal.amount.toLocaleString('en-KE')} has been paid via M-Pesa (ref: ${params.mpesaReference}).`,
    });

    await writeAuditLog(tx, {
      actorId: params.adminId,
      action: 'WITHDRAWAL_APPROVED',
      entityType: 'Withdrawal',
      entityId: withdrawal.id,
      oldValue: { status: 'PENDING' },
      newValue: { status: 'PAID', mpesaReference: params.mpesaReference },
      ...ctx,
    });
  });
}

export async function rejectWithdrawal(
  params: { withdrawalId: string; adminId: string; rejectionReason: string; adminNote?: string },
  ctx: AuditContext
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [withdrawal] = await tx.$queryRaw<Array<{ id: string; status: string; userId: string; amount: number }>>`
      SELECT id, status, "userId", amount FROM "Withdrawal" WHERE id = ${params.withdrawalId} FOR UPDATE
    `;
    if (!withdrawal) throw new WithdrawalError('NOT_FOUND', 'Withdrawal not found');
    if (withdrawal.status !== 'PENDING') {
      throw new WithdrawalError('ALREADY_PROCESSED', 'This withdrawal has already been processed');
    }

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'REJECTED',
        rejectionReason: params.rejectionReason,
        adminNote: params.adminNote || undefined,
        processedById: params.adminId,
        processedAt: new Date(),
      },
    });

    await releaseReservedWithdrawal(tx, {
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      withdrawalId: withdrawal.id,
      asPaid: false,
    });

    await createNotification(tx, {
      userId: withdrawal.userId,
      type: 'WITHDRAWAL_REJECTED',
      title: 'Withdrawal rejected',
      message: `Your withdrawal request of KSh ${withdrawal.amount.toLocaleString('en-KE')} was rejected: ${params.rejectionReason}. The funds have been returned to your available balance.`,
    });

    await writeAuditLog(tx, {
      actorId: params.adminId,
      action: 'WITHDRAWAL_REJECTED',
      entityType: 'Withdrawal',
      entityId: withdrawal.id,
      oldValue: { status: 'PENDING' },
      newValue: { status: 'REJECTED', rejectionReason: params.rejectionReason },
      ...ctx,
    });
  });
}
