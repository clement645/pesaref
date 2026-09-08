import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { resetDatabase, createTestUser, getWallet, noopCtx } from './helpers';
import { requestWithdrawal, markWithdrawalPaid, rejectWithdrawal, WithdrawalError } from '@/lib/services/withdrawal.service';
import { applyAvailableBalanceChange } from '@/lib/services/wallet.service';

async function fund(userId: string, amount: number) {
  await prisma.$transaction((tx) =>
    applyAvailableBalanceChange(tx, {
      userId,
      amount,
      type: 'ADJUSTMENT',
      description: 'Test funding',
      incrementTotalEarned: true,
    })
  );
}

describe('Withdrawal test: reservation, payout, and rejection', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reserves the requested amount instead of deducting it permanently', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    await fund(user.id, 1000);

    const { withdrawalId } = await requestWithdrawal({ userId: user.id, amount: 750, phone: user.phone }, noopCtx);

    const wallet = await getWallet(user.id);
    expect(wallet.availableBalance).toBe(250);
    expect(wallet.pendingWithdrawal).toBe(750);

    // The same 750 cannot be requested again since only 250 remains available.
    await expect(requestWithdrawal({ userId: user.id, amount: 750, phone: user.phone }, noopCtx)).rejects.toThrow(
      WithdrawalError
    );

    const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
    expect(withdrawal.status).toBe('PENDING');
  });

  it('moves funds to totalWithdrawn once an admin marks the withdrawal as paid', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    const admin = await createTestUser({ status: 'ACTIVE' });
    await fund(user.id, 1000);

    const { withdrawalId } = await requestWithdrawal({ userId: user.id, amount: 750, phone: user.phone }, noopCtx);
    await markWithdrawalPaid({ withdrawalId, adminId: admin.id, mpesaReference: 'QFT-TEST-1' }, noopCtx);

    const wallet = await getWallet(user.id);
    expect(wallet.pendingWithdrawal).toBe(0);
    expect(wallet.totalWithdrawn).toBe(750);
    expect(wallet.availableBalance).toBe(250);

    const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
    expect(withdrawal.status).toBe('PAID');
    expect(withdrawal.mpesaReference).toBe('QFT-TEST-1');
  });

  it('returns reserved funds to available balance when a withdrawal is rejected', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    const admin = await createTestUser({ status: 'ACTIVE' });
    await fund(user.id, 1000);

    const { withdrawalId } = await requestWithdrawal({ userId: user.id, amount: 750, phone: user.phone }, noopCtx);
    await rejectWithdrawal({ withdrawalId, adminId: admin.id, rejectionReason: 'Invalid payment details' }, noopCtx);

    const wallet = await getWallet(user.id);
    expect(wallet.pendingWithdrawal).toBe(0);
    expect(wallet.availableBalance).toBe(1000);
    expect(wallet.totalWithdrawn).toBe(0);

    const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
    expect(withdrawal.status).toBe('REJECTED');
  });

  it('rejects a withdrawal request greater than the available balance', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    await fund(user.id, 300);

    await expect(requestWithdrawal({ userId: user.id, amount: 500, phone: user.phone }, noopCtx)).rejects.toThrow(
      WithdrawalError
    );
  });

  it('rejects withdrawal requests below the configured minimum', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    await fund(user.id, 1000);

    await expect(requestWithdrawal({ userId: user.id, amount: 100, phone: user.phone }, noopCtx)).rejects.toThrow(
      'Minimum withdrawal amount'
    );
  });

  it('prevents suspended users from requesting withdrawals', async () => {
    const user = await createTestUser({ status: 'SUSPENDED' });
    await fund(user.id, 1000);

    await expect(requestWithdrawal({ userId: user.id, amount: 500, phone: user.phone }, noopCtx)).rejects.toThrow(
      'Only active accounts'
    );
  });

  it('processes concurrent withdrawal requests safely without over-drafting the wallet', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    await fund(user.id, 1000);

    const results = await Promise.allSettled([
      requestWithdrawal({ userId: user.id, amount: 700, phone: user.phone }, noopCtx),
      requestWithdrawal({ userId: user.id, amount: 700, phone: user.phone }, noopCtx),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const wallet = await getWallet(user.id);
    expect(wallet.availableBalance).toBe(300);
    expect(wallet.pendingWithdrawal).toBe(700);
  });
});
