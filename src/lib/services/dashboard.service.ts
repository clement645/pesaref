import 'server-only';
import { prisma } from '@/lib/db';

export async function getUserDashboardData(userId: string) {
  const [wallet, referralStats, recentTransactions, recentReferrals, latestPayment, pendingWithdrawalCount] =
    await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.referral.groupBy({
        by: ['status'],
        where: { referrerId: userId },
        _count: { _all: true },
      }),
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { referred: { select: { fullName: true } } },
      }),
      prisma.payment.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.withdrawal.count({ where: { userId, status: 'PENDING' } }),
    ]);

  const totalReferred = referralStats.reduce((sum, r) => sum + r._count._all, 0);
  const successfulReferrals = referralStats.find((r) => r.status === 'COMMISSIONED')?._count._all ?? 0;
  const pendingReferrals = referralStats
    .filter((r) => ['REGISTERED', 'PAYMENT_PENDING', 'QUALIFIED'].includes(r.status))
    .reduce((sum, r) => sum + r._count._all, 0);

  return {
    wallet,
    totalReferred,
    successfulReferrals,
    pendingReferrals,
    recentTransactions,
    recentReferrals,
    latestPayment,
    pendingWithdrawalCount,
  };
}
