import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { resetDatabase, createTestUser, getWallet, noopCtx } from './helpers';
import { updateUserStatus, adjustWallet } from '@/lib/services/admin-user.service';
import { applyAvailableBalanceChange, InsufficientBalanceError } from '@/lib/services/wallet.service';

describe('Admin actions: status changes and wallet adjustments are always audited', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('suspending a user writes an audit log entry with old and new status', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    const admin = await createTestUser({ status: 'ACTIVE' });

    await updateUserStatus({ userId: user.id, status: 'SUSPENDED', adminId: admin.id, reason: 'Policy violation' }, noopCtx);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.status).toBe('SUSPENDED');

    const log = await prisma.auditLog.findFirstOrThrow({ where: { entityType: 'User', entityId: user.id, action: 'USER_STATUS_SUSPENDED' } });
    expect(log.actorId).toBe(admin.id);
    expect((log.oldValue as { status: string }).status).toBe('ACTIVE');
  });

  it('manual wallet adjustments create a ledger entry and audit log rather than mutating the balance silently', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });
    const admin = await createTestUser({ status: 'ACTIVE' });

    await adjustWallet({ userId: user.id, amount: 100, adminId: admin.id, reason: 'Goodwill credit' }, noopCtx);

    const wallet = await getWallet(user.id);
    expect(wallet.availableBalance).toBe(100);

    const txn = await prisma.walletTransaction.findFirstOrThrow({ where: { userId: user.id, type: 'ADJUSTMENT' } });
    expect(txn.amount).toBe(100);

    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: 'WALLET_ADJUSTMENT', entityId: txn.id } });
    expect(log.actorId).toBe(admin.id);
  });

  it('rolls back the entire transaction when a balance change would go negative', async () => {
    const user = await createTestUser({ status: 'ACTIVE' });

    await expect(
      prisma.$transaction((tx) =>
        applyAvailableBalanceChange(tx, { userId: user.id, amount: -50, type: 'ADJUSTMENT', description: 'Should fail' })
      )
    ).rejects.toThrow(InsufficientBalanceError);

    const wallet = await getWallet(user.id);
    expect(wallet.availableBalance).toBe(0);
    const transactions = await prisma.walletTransaction.findMany({ where: { userId: user.id } });
    expect(transactions).toHaveLength(0);
  });
});
