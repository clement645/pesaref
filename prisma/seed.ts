/**
 * PesaRef development/test seed data.
 *
 * This script is for LOCAL DEVELOPMENT AND TESTING ONLY. It creates a
 * SUPER_ADMIN account from environment variables and a handful of sample
 * users, payments, referrals, commissions, and withdrawals so the dashboards
 * have realistic data to display. None of these are real credentials or
 * real money - do not run this against a production database.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function createUserWithWallet(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status?: 'PENDING_PAYMENT' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  referralCode: string;
  referredById?: string;
}) {
  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role ?? 'USER',
      status: data.status ?? 'PENDING_PAYMENT',
      referralCode: data.referralCode,
      referredById: data.referredById,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return user;
}

async function creditCommission(userId: string, referralId: string, amount: number) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  const balanceBefore = wallet.availableBalance;
  const balanceAfter = balanceBefore + amount;

  const txn = await prisma.walletTransaction.create({
    data: {
      userId,
      type: 'REFERRAL_COMMISSION',
      amount,
      balanceBefore,
      balanceAfter,
      description: 'Referral commission for a successful referral (seed data)',
      relatedReferralId: referralId,
    },
  });

  await prisma.wallet.update({
    where: { userId },
    data: { availableBalance: balanceAfter, totalEarned: { increment: amount }, version: { increment: 1 } },
  });

  await prisma.referral.update({
    where: { id: referralId },
    data: { status: 'COMMISSIONED', commissionAmount: amount, walletTransactionId: txn.id },
  });
}

async function reserveWithdrawal(userId: string, amount: number, phone: string) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  const withdrawal = await prisma.withdrawal.create({
    data: { userId, amount, phone, status: 'PENDING' },
  });

  const balanceBefore = wallet.availableBalance;
  const balanceAfter = balanceBefore - amount;

  await prisma.walletTransaction.create({
    data: {
      userId,
      type: 'WITHDRAWAL_REQUEST',
      amount: -amount,
      balanceBefore,
      balanceAfter,
      description: 'Funds reserved for withdrawal request (seed data)',
      relatedWithdrawalId: withdrawal.id,
    },
  });

  await prisma.wallet.update({
    where: { userId },
    data: { availableBalance: balanceAfter, pendingWithdrawal: { increment: amount }, version: { increment: 1 } },
  });

  return withdrawal;
}

async function payWithdrawal(withdrawalId: string, adminId: string, mpesaReference: string) {
  const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

  await prisma.wallet.update({
    where: { userId: withdrawal.userId },
    data: {
      pendingWithdrawal: { decrement: withdrawal.amount },
      totalWithdrawn: { increment: withdrawal.amount },
      version: { increment: 1 },
    },
  });

  await prisma.walletTransaction.create({
    data: {
      userId: withdrawal.userId,
      type: 'WITHDRAWAL_PAID',
      amount: 0,
      balanceBefore: 0,
      balanceAfter: 0,
      description: 'Withdrawal paid out by admin (seed data)',
      relatedWithdrawalId: withdrawal.id,
    },
  });

  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: 'PAID', mpesaReference, processedById: adminId, processedAt: new Date() },
  });
}

async function main() {
  console.log('Seeding PesaRef development data...');

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeThisImmediately123!';
  const adminFullName = process.env.ADMIN_FULL_NAME ?? 'Platform Administrator';
  const adminPhone = process.env.ADMIN_PHONE ?? '+254700000000';

  const superAdmin = await createUserWithWallet({
    fullName: adminFullName,
    email: adminEmail,
    phone: adminPhone,
    password: adminPassword,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    referralCode: 'PESAREFADMIN',
  });
  console.log(`SUPER_ADMIN ready: ${superAdmin.email} (password from ADMIN_PASSWORD env var)`);

  await prisma.systemSetting.upsert({
    where: { key: 'registrationFeeKes' },
    update: {},
    create: { key: 'registrationFeeKes', value: '200' },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'referralCommissionKes' },
    update: {},
    create: { key: 'referralCommissionKes', value: '100' },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'minWithdrawalKes' },
    update: {},
    create: { key: 'minWithdrawalKes', value: '250' },
  });

  // Sample staff/member accounts and fake financial history are for local
  // development and demos only. Set SEED_SAMPLE_DATA=false (e.g. in
  // production) to create just the SUPER_ADMIN account above and stop here.
  const seedSampleData = process.env.SEED_SAMPLE_DATA !== 'false';
  if (!seedSampleData) {
    console.log('SEED_SAMPLE_DATA=false - skipping sample staff/member accounts and demo data.');
    console.log('Seed complete. Production admin login:');
    console.log('  SUPER_ADMIN : ' + adminEmail + ' / (value of ADMIN_PASSWORD env var)');
    return;
  }

  const staffAdmin = await createUserWithWallet({
    fullName: 'Staff Admin (seed)',
    email: 'staffadmin@example.com',
    phone: '0700000001',
    password: 'StaffAdmin123!',
    role: 'ADMIN',
    status: 'ACTIVE',
    referralCode: 'PESAREFSTAFF',
  });
  console.log('Sample ADMIN (dev only): staffadmin@example.com / StaffAdmin123!');

  const alice = await createUserWithWallet({
    fullName: 'Alice Wanjiru',
    email: 'alice@example.com',
    phone: '0711000001',
    password: 'Password123!',
    status: 'ACTIVE',
    referralCode: 'ALICE1234',
  });

  const bob = await createUserWithWallet({
    fullName: 'Bob Otieno',
    email: 'bob@example.com',
    phone: '0711000002',
    password: 'Password123!',
    status: 'ACTIVE',
    referralCode: 'BOB56789A',
    referredById: alice.id,
  });

  const dave = await createUserWithWallet({
    fullName: 'Dave Kimani',
    email: 'dave@example.com',
    phone: '0711000003',
    password: 'Password123!',
    status: 'ACTIVE',
    referralCode: 'DAVEXYZ12',
    referredById: alice.id,
  });

  const carol = await createUserWithWallet({
    fullName: 'Carol Achieng',
    email: 'carol@example.com',
    phone: '0711000004',
    password: 'Password123!',
    status: 'PENDING_PAYMENT',
    referralCode: 'CAROL4567',
    referredById: alice.id,
  });

  const grace = await createUserWithWallet({
    fullName: 'Grace Njeri',
    email: 'grace@example.com',
    phone: '0711000005',
    password: 'Password123!',
    status: 'PENDING_PAYMENT',
    referralCode: 'GRACE8899',
    referredById: dave.id,
  });

  const irene = await createUserWithWallet({
    fullName: 'Irene Mwikali',
    email: 'irene@example.com',
    phone: '0711000006',
    password: 'Password123!',
    status: 'ACTIVE',
    referralCode: 'IRENE2020',
    referredById: dave.id,
  });

  const henry = await createUserWithWallet({
    fullName: 'Henry Mutua',
    email: 'henry@example.com',
    phone: '0711000007',
    password: 'Password123!',
    status: 'PENDING_PAYMENT',
    referralCode: 'HENRY3344',
  });

  const alreadySeeded = await prisma.payment.findFirst({ where: { paymentReference: 'QFT1SEEDBOB' } });
  if (alreadySeeded) {
    console.log('Sample payments/referrals/withdrawals already exist - skipping (users were upserted above).');
    console.log('Seed complete. Sample login credentials (development only):');
    console.log('  SUPER_ADMIN : ' + adminEmail + ' / (value of ADMIN_PASSWORD env var)');
    console.log('  ADMIN       : staffadmin@example.com / StaffAdmin123!');
    console.log('  USER (Alice, active, has earned commissions): alice@example.com / Password123!');
    console.log('  USER (Bob, active, was referred by Alice): bob@example.com / Password123!');
    console.log('  USER (Carol, pending payment): carol@example.com / Password123!');
    console.log('  USER (Henry, payment pending review): henry@example.com / Password123!');
    return;
  }

  // --- Payments -------------------------------------------------------
  const bobPayment = await prisma.payment.create({
    data: {
      userId: bob.id,
      amount: 200,
      status: 'APPROVED',
      paymentReference: 'QFT1SEEDBOB',
      paymentPhone: bob.phone,
      paymentDate: new Date(Date.now() - 6 * 86400000),
      reviewedById: superAdmin.id,
      reviewedAt: new Date(Date.now() - 6 * 86400000),
    },
  });

  const davePayment = await prisma.payment.create({
    data: {
      userId: dave.id,
      amount: 200,
      status: 'APPROVED',
      paymentReference: 'QFT1SEEDDAVE',
      paymentPhone: dave.phone,
      paymentDate: new Date(Date.now() - 5 * 86400000),
      reviewedById: superAdmin.id,
      reviewedAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  const irenePayment = await prisma.payment.create({
    data: {
      userId: irene.id,
      amount: 200,
      status: 'APPROVED',
      paymentReference: 'QFT1SEEDIRENE',
      paymentPhone: irene.phone,
      paymentDate: new Date(Date.now() - 2 * 86400000),
      reviewedById: staffAdmin.id,
      reviewedAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  await prisma.payment.create({
    data: {
      userId: grace.id,
      amount: 200,
      status: 'REJECTED',
      paymentReference: 'QFT1SEEDGRACE',
      paymentPhone: grace.phone,
      paymentDate: new Date(Date.now() - 3 * 86400000),
      reviewedById: staffAdmin.id,
      reviewedAt: new Date(Date.now() - 3 * 86400000),
      rejectionReason: 'Transaction reference could not be verified with M-Pesa records',
    },
  });

  await prisma.payment.create({
    data: {
      userId: henry.id,
      amount: 200,
      status: 'PENDING',
      paymentReference: 'QFT1SEEDHENRY',
      paymentPhone: henry.phone,
      paymentDate: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      userId: carol.id,
      amount: 200,
      status: 'PENDING',
      paymentReference: 'QFT1SEEDCAROL',
      paymentPhone: carol.phone,
      paymentDate: new Date(),
    },
  });

  // --- Referrals + commissions -----------------------------------------
  const bobReferral = await prisma.referral.create({
    data: {
      referrerId: alice.id,
      referredId: bob.id,
      referralCodeUsed: alice.referralCode,
      status: 'QUALIFIED',
      qualifyingPaymentId: bobPayment.id,
    },
  });
  await creditCommission(alice.id, bobReferral.id, 100);

  const daveReferral = await prisma.referral.create({
    data: {
      referrerId: alice.id,
      referredId: dave.id,
      referralCodeUsed: alice.referralCode,
      status: 'QUALIFIED',
      qualifyingPaymentId: davePayment.id,
    },
  });
  await creditCommission(alice.id, daveReferral.id, 100);

  const ireneReferral = await prisma.referral.create({
    data: {
      referrerId: dave.id,
      referredId: irene.id,
      referralCodeUsed: dave.referralCode,
      status: 'QUALIFIED',
      qualifyingPaymentId: irenePayment.id,
    },
  });
  await creditCommission(dave.id, ireneReferral.id, 100);

  // Grace's payment was rejected - referral stays REGISTERED, no commission.
  await prisma.referral.create({
    data: {
      referrerId: dave.id,
      referredId: grace.id,
      referralCodeUsed: dave.referralCode,
      status: 'REGISTERED',
    },
  });

  // Carol's payment is still pending - referral reflects that, no commission yet.
  await prisma.referral.create({
    data: {
      referrerId: alice.id,
      referredId: carol.id,
      referralCodeUsed: alice.referralCode,
      status: 'PAYMENT_PENDING',
    },
  });

  // --- Withdrawals -------------------------------------------------------
  // Alice has 200 available (2 x 100 commissions). Request + pay 150.
  const aliceWithdrawal = await reserveWithdrawal(alice.id, 150, alice.phone);
  await payWithdrawal(aliceWithdrawal.id, superAdmin.id, 'QFT1SEEDPAYOUT1');

  // Dave has 100 available. Request a withdrawal that stays PENDING for the
  // admin demo (mark-as-paid / reject screens).
  await reserveWithdrawal(dave.id, 100, dave.phone);

  console.log('Seed complete. Sample login credentials (development only):');
  console.log('  SUPER_ADMIN : ' + adminEmail + ' / (value of ADMIN_PASSWORD env var)');
  console.log('  ADMIN       : staffadmin@example.com / StaffAdmin123!');
  console.log('  USER (Alice, active, has earned commissions): alice@example.com / Password123!');
  console.log('  USER (Bob, active, was referred by Alice): bob@example.com / Password123!');
  console.log('  USER (Carol, pending payment): carol@example.com / Password123!');
  console.log('  USER (Henry, payment pending review): henry@example.com / Password123!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
