import 'server-only';
import type { Prisma, WalletTransactionType } from '@prisma/client';

/**
 * Locks the user's wallet row for the remainder of the current transaction
 * using SELECT ... FOR UPDATE. This serializes concurrent financial
 * operations (e.g. two withdrawal requests, or a commission credit racing a
 * withdrawal debit) on the same wallet so balances never go negative or get
 * corrupted by a lost update.
 */
export async function lockWallet(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<{
  id: string;
  userId: string;
  totalEarned: number;
  availableBalance: number;
  pendingWithdrawal: number;
  totalWithdrawn: number;
  version: number;
}> {
  const rows = await tx.$queryRaw<
    Array<{
      id: string;
      userId: string;
      totalEarned: number;
      availableBalance: number;
      pendingWithdrawal: number;
      totalWithdrawn: number;
      version: number;
    }>
  >`SELECT id, "userId", "totalEarned", "availableBalance", "pendingWithdrawal", "totalWithdrawn", version
    FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE`;

  const wallet = rows[0];
  if (!wallet) {
    throw new Error(`Wallet not found for user ${userId}`);
  }
  return wallet;
}

interface LedgerEntryInput {
  userId: string;
  type: WalletTransactionType;
  amount: number; // signed: positive credits, negative debits
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description: string;
  relatedReferralId?: string;
  relatedWithdrawalId?: string;
}

/**
 * Credits (positive amount) or debits (negative amount) a user's available
 * balance and writes a matching ledger entry. Must be called with the
 * wallet already locked via lockWallet() in the same transaction.
 */
export async function applyAvailableBalanceChange(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    amount: number;
    type: WalletTransactionType;
    description: string;
    reference?: string;
    relatedReferralId?: string;
    relatedWithdrawalId?: string;
    /** Also increment totalEarned (used for referral commissions). */
    incrementTotalEarned?: boolean;
  }
): Promise<{ walletTransactionId: string }> {
  const wallet = await lockWallet(tx, params.userId);
  const balanceBefore = wallet.availableBalance;
  const balanceAfter = balanceBefore + params.amount;

  if (balanceAfter < 0) {
    throw new InsufficientBalanceError(params.userId, balanceBefore, params.amount);
  }

  await tx.wallet.update({
    where: { userId: params.userId },
    data: {
      availableBalance: balanceAfter,
      totalEarned: params.incrementTotalEarned
        ? { increment: params.amount }
        : undefined,
      version: { increment: 1 },
    },
  });

  const entry: LedgerEntryInput = {
    userId: params.userId,
    type: params.type,
    amount: params.amount,
    balanceBefore,
    balanceAfter,
    reference: params.reference,
    description: params.description,
    relatedReferralId: params.relatedReferralId,
    relatedWithdrawalId: params.relatedWithdrawalId,
  };

  const txn = await tx.walletTransaction.create({ data: entry });
  return { walletTransactionId: txn.id };
}

export async function reserveForWithdrawal(
  tx: Prisma.TransactionClient,
  params: { userId: string; amount: number; withdrawalId: string }
): Promise<{ walletTransactionId: string }> {
  const wallet = await lockWallet(tx, params.userId);
  if (wallet.availableBalance < params.amount) {
    throw new InsufficientBalanceError(params.userId, wallet.availableBalance, -params.amount);
  }

  const balanceBefore = wallet.availableBalance;
  const balanceAfter = balanceBefore - params.amount;

  await tx.wallet.update({
    where: { userId: params.userId },
    data: {
      availableBalance: balanceAfter,
      pendingWithdrawal: { increment: params.amount },
      version: { increment: 1 },
    },
  });

  const txn = await tx.walletTransaction.create({
    data: {
      userId: params.userId,
      type: 'WITHDRAWAL_REQUEST',
      amount: -params.amount,
      balanceBefore,
      balanceAfter,
      description: 'Funds reserved for withdrawal request',
      relatedWithdrawalId: params.withdrawalId,
    },
  });

  return { walletTransactionId: txn.id };
}

export async function releaseReservedWithdrawal(
  tx: Prisma.TransactionClient,
  params: { userId: string; amount: number; withdrawalId: string; asPaid: boolean }
): Promise<{ walletTransactionId: string }> {
  const wallet = await lockWallet(tx, params.userId);
  const balanceBefore = wallet.availableBalance;

  if (params.asPaid) {
    await tx.wallet.update({
      where: { userId: params.userId },
      data: {
        pendingWithdrawal: { decrement: params.amount },
        totalWithdrawn: { increment: params.amount },
        version: { increment: 1 },
      },
    });
  } else {
    await tx.wallet.update({
      where: { userId: params.userId },
      data: {
        pendingWithdrawal: { decrement: params.amount },
        availableBalance: { increment: params.amount },
        version: { increment: 1 },
      },
    });
  }

  const balanceAfter = params.asPaid ? balanceBefore : balanceBefore + params.amount;

  const txn = await tx.walletTransaction.create({
    data: {
      userId: params.userId,
      type: params.asPaid ? 'WITHDRAWAL_PAID' : 'WITHDRAWAL_REJECTED',
      amount: params.asPaid ? 0 : params.amount,
      balanceBefore,
      balanceAfter,
      description: params.asPaid
        ? 'Withdrawal paid out by admin'
        : 'Withdrawal rejected - funds released back to available balance',
      relatedWithdrawalId: params.withdrawalId,
    },
  });

  return { walletTransactionId: txn.id };
}

export class InsufficientBalanceError extends Error {
  constructor(public userId: string, public available: number, public attemptedDelta: number) {
    super(`Insufficient balance for user ${userId}`);
    this.name = 'InsufficientBalanceError';
  }
}
