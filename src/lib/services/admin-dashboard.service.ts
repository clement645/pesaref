import 'server-only';
import { prisma } from '@/lib/db';

function bucketByDay(dates: Date[], days: number): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export async function getAdminDashboardData(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalUsers,
    activeUsers,
    pendingPayments,
    approvedPayments,
    totalCommissions,
    pendingWithdrawals,
    paidWithdrawals,
    totalWithdrawn,
    registrations,
    approvedPaymentDates,
    commissionDates,
    withdrawalDates,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'USER', status: 'ACTIVE' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'APPROVED' } }),
    prisma.referral.aggregate({ where: { status: 'COMMISSIONED' }, _sum: { commissionAmount: true } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    prisma.withdrawal.count({ where: { status: 'PAID' } }),
    prisma.withdrawal.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.user.findMany({ where: { role: 'USER', createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.payment.findMany({ where: { status: 'APPROVED', reviewedAt: { gte: since } }, select: { reviewedAt: true } }),
    prisma.referral.findMany({ where: { status: 'COMMISSIONED', updatedAt: { gte: since } }, select: { updatedAt: true } }),
    prisma.withdrawal.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'USER_REGISTERED',
            'PAYMENT_APPROVED',
            'REFERRAL_COMMISSIONED',
            'WITHDRAWAL_REQUESTED',
            'WITHDRAWAL_APPROVED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { actor: { select: { fullName: true, email: true } } },
    }),
  ]);

  return {
    cards: {
      totalUsers,
      activeUsers,
      pendingPayments,
      approvedPayments,
      totalCommissions: totalCommissions._sum.commissionAmount ?? 0,
      pendingWithdrawals,
      paidWithdrawals,
      totalWithdrawn: totalWithdrawn._sum.amount ?? 0,
    },
    charts: {
      registrations: bucketByDay(registrations.map((r) => r.createdAt), days),
      approvedPayments: bucketByDay(approvedPaymentDates.map((r) => r.reviewedAt!).filter(Boolean), days),
      commissions: bucketByDay(commissionDates.map((r) => r.updatedAt), days),
      withdrawals: bucketByDay(withdrawalDates.map((r) => r.createdAt), days),
    },
    recentActivity: recentAuditLogs,
  };
}
