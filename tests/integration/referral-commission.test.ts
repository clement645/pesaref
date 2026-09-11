import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { resetDatabase, createTestUser, getWallet, noopCtx } from './helpers';
import { submitPayment, approvePayment, rejectPayment, PaymentError } from '@/lib/services/payment.service';
import { registerUser } from '@/lib/services/user.service';

describe('Critical financial test: referral commission lifecycle', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('credits exactly one KSh 100 commission when a referred user\'s payment is approved', async () => {
    const userA = await createTestUser({ status: 'ACTIVE' });

    const { userId: userBId } = await registerUser(
      {
        fullName: 'User B',
        email: 'userb-commission@example.com',
        phone: '0722334455',
        password: 'Password123!',
        referralCode: userA.referralCode,
      },
      noopCtx
    );

    await submitPayment(
      { userId: userBId, paymentReference: 'REF-B-1', paymentPhone: '0722334455', paymentDate: new Date().toISOString() },
      noopCtx
    );

    const payment = await prisma.payment.findFirstOrThrow({ where: { userId: userBId } });
    await approvePayment({ paymentId: payment.id, adminId: userA.id, adminNote: '' }, noopCtx);

    const walletA = await getWallet(userA.id);
    expect(walletA.availableBalance).toBe(100);
    expect(walletA.totalEarned).toBe(100);

    const referral = await prisma.referral.findUniqueOrThrow({ where: { referredId: userBId } });
    expect(referral.status).toBe('COMMISSIONED');
    expect(referral.commissionAmount).toBe(100);

    const userB = await prisma.user.findUniqueOrThrow({ where: { id: userBId } });
    expect(userB.status).toBe('ACTIVE');
  });

  it('never creates a second commission when the same payment is approved twice', async () => {
    const userA = await createTestUser({ status: 'ACTIVE' });
    const { userId: userBId } = await registerUser(
      {
        fullName: 'User B2',
        email: 'userb2-commission@example.com',
        phone: '0722334456',
        password: 'Password123!',
        referralCode: userA.referralCode,
      },
      noopCtx
    );
    await submitPayment(
      { userId: userBId, paymentReference: 'REF-B-2', paymentPhone: '0722334456', paymentDate: new Date().toISOString() },
      noopCtx
    );
    const payment = await prisma.payment.findFirstOrThrow({ where: { userId: userBId } });

    await approvePayment({ paymentId: payment.id, adminId: userA.id, adminNote: '' }, noopCtx);

    await expect(approvePayment({ paymentId: payment.id, adminId: userA.id, adminNote: '' }, noopCtx)).rejects.toThrow(
      PaymentError
    );

    const walletA = await getWallet(userA.id);
    expect(walletA.availableBalance).toBe(100); // still only one commission

    const transactions = await prisma.walletTransaction.findMany({ where: { userId: userA.id, type: 'REFERRAL_COMMISSION' } });
    expect(transactions).toHaveLength(1);
  });

  it('never creates a commission when the qualifying payment is rejected', async () => {
    const userA = await createTestUser({ status: 'ACTIVE' });
    const { userId: userBId } = await registerUser(
      {
        fullName: 'User B3',
        email: 'userb3-commission@example.com',
        phone: '0722334457',
        password: 'Password123!',
        referralCode: userA.referralCode,
      },
      noopCtx
    );
    await submitPayment(
      { userId: userBId, paymentReference: 'REF-B-3', paymentPhone: '0722334457', paymentDate: new Date().toISOString() },
      noopCtx
    );
    const payment = await prisma.payment.findFirstOrThrow({ where: { userId: userBId } });

    await rejectPayment({ paymentId: payment.id, adminId: userA.id, rejectionReason: 'Could not verify' }, noopCtx);

    const walletA = await getWallet(userA.id);
    expect(walletA.availableBalance).toBe(0);

    const referral = await prisma.referral.findUniqueOrThrow({ where: { referredId: userBId } });
    expect(referral.status).toBe('REGISTERED');
    expect(referral.commissionAmount).toBeNull();
  });

  it('withholds the commission while the referrer is suspended', async () => {
    const userA = await createTestUser({ status: 'SUSPENDED' });
    const { userId: userBId } = await registerUser(
      {
        fullName: 'User B4',
        email: 'userb4-commission@example.com',
        phone: '0722334458',
        password: 'Password123!',
        referralCode: userA.referralCode,
      },
      noopCtx
    );
    await submitPayment(
      { userId: userBId, paymentReference: 'REF-B-4', paymentPhone: '0722334458', paymentDate: new Date().toISOString() },
      noopCtx
    );
    const payment = await prisma.payment.findFirstOrThrow({ where: { userId: userBId } });

    await approvePayment({ paymentId: payment.id, adminId: userA.id, adminNote: '' }, noopCtx);

    const walletA = await getWallet(userA.id);
    expect(walletA.availableBalance).toBe(0);

    const referral = await prisma.referral.findUniqueOrThrow({ where: { referredId: userBId } });
    expect(referral.status).toBe('QUALIFIED');
    expect(referral.commissionAmount).toBeNull();
  });

  it('rejects registration with a duplicate email or phone number', async () => {
    await registerUser(
      { fullName: 'Dup User', email: 'dup@example.com', phone: '0733112233', password: 'Password123!' },
      noopCtx
    );

    await expect(
      registerUser({ fullName: 'Dup User 2', email: 'dup@example.com', phone: '0733112244', password: 'Password123!' }, noopCtx)
    ).rejects.toThrow('email already exists');

    await expect(
      registerUser({ fullName: 'Dup User 3', email: 'dup2@example.com', phone: '0733112233', password: 'Password123!' }, noopCtx)
    ).rejects.toThrow('phone number already exists');
  });

  it('rejects registration with an invalid referral code', async () => {
    await expect(
      registerUser(
        { fullName: 'Bad Ref', email: 'badref@example.com', phone: '0733112255', password: 'Password123!', referralCode: 'DOESNOTEXIST' },
        noopCtx
      )
    ).rejects.toThrow('Referral code is not valid');
  });
});
