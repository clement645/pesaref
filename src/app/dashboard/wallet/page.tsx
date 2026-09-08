import { Wallet, TrendingUp, Clock, Banknote } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Wallet - PesaRef' };

const TYPE_LABELS: Record<string, string> = {
  REFERRAL_COMMISSION: 'Referral commission',
  WITHDRAWAL_REQUEST: 'Withdrawal reserved',
  WITHDRAWAL_PAID: 'Withdrawal paid',
  WITHDRAWAL_REJECTED: 'Withdrawal refunded',
  ADJUSTMENT: 'Manual adjustment',
  REVERSAL: 'Reversal',
};

export default async function WalletPage() {
  const user = await requireUser();
  const [wallet, transactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.walletTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available balance" value={formatKES(wallet?.availableBalance ?? 0)} icon={Wallet} tone="success" />
        <StatCard label="Total earned" value={formatKES(wallet?.totalEarned ?? 0)} icon={TrendingUp} />
        <StatCard label="Pending withdrawal" value={formatKES(wallet?.pendingWithdrawal ?? 0)} icon={Clock} tone="warning" />
        <StatCard label="Total withdrawn" value={formatKES(wallet?.totalWithdrawn ?? 0)} icon={Banknote} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState icon={Wallet} title="No transactions yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance after</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{t.createdAt.toLocaleString('en-KE')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[t.type] ?? t.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.amount >= 0 ? '+' : ''}
                      {formatKES(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">{formatKES(t.balanceAfter)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
