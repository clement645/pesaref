import 'server-only';
import { prisma } from '@/lib/db';
import type { UserStatus } from '@prisma/client';
import { writeAuditLog, type AuditContext } from '@/lib/services/audit.service';
import { createNotification } from '@/lib/services/notification.service';
import { applyAvailableBalanceChange } from '@/lib/services/wallet.service';

export class AdminActionError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AdminActionError';
  }
}

export async function updateUserStatus(
  params: { userId: string; status: UserStatus; adminId: string; reason?: string },
  ctx: AuditContext
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: params.userId } });
    if (!user) throw new AdminActionError('NOT_FOUND', 'User not found');
    if (user.role !== 'USER') {
      throw new AdminActionError('FORBIDDEN', 'Admin accounts cannot have their status changed here');
    }

    const previousStatus = user.status;
    await tx.user.update({ where: { id: user.id }, data: { status: params.status } });

    await createNotification(tx, {
      userId: user.id,
      type: 'PAYMENT_APPROVED',
      title: 'Account status updated',
      message: `Your account status changed from ${previousStatus} to ${params.status}.${
        params.reason ? ` Reason: ${params.reason}` : ''
      }`,
    });

    await writeAuditLog(tx, {
      actorId: params.adminId,
      action: `USER_STATUS_${params.status}`,
      entityType: 'User',
      entityId: user.id,
      oldValue: { status: previousStatus },
      newValue: { status: params.status, reason: params.reason },
      ...ctx,
    });
  });
}

/**
 * Manual wallet adjustment (correction). Always ledgered and audited -
 * never silently mutates the balance field.
 */
export async function adjustWallet(
  params: { userId: string; amount: number; adminId: string; reason: string },
  ctx: AuditContext
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: params.userId } });
    if (!user) throw new AdminActionError('NOT_FOUND', 'User not found');

    const { walletTransactionId } = await applyAvailableBalanceChange(tx, {
      userId: params.userId,
      amount: params.amount,
      type: 'ADJUSTMENT',
      description: `Manual adjustment by admin: ${params.reason}`,
    });

    await writeAuditLog(tx, {
      actorId: params.adminId,
      action: 'WALLET_ADJUSTMENT',
      entityType: 'WalletTransaction',
      entityId: walletTransactionId,
      newValue: { userId: params.userId, amount: params.amount, reason: params.reason },
      ...ctx,
    });
  });
}
