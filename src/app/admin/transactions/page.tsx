import { Receipt } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Transactions - PesaRef Admin' };

const TYPE_LABELS: Record<string, string> = {
  REFERRAL_COMMISSION: 'Referral commission',
  WITHDRAWAL_REQUEST: 'Withdrawal reserved',
  WITHDRAWAL_PAID: 'Withdrawal paid',
  WITHDRAWAL_REJECTED: 'Withdrawal refunded',
  ADJUSTMENT: 'Manual adjustment',
  REVERSAL: 'Reversal',
};

export default async function AdminTransactionsPage() {
  const transactions = await prisma.walletTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { fullName: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All wallet transactions</h1>

      <Card>
        <CardHeader>
          <CardTitle>{transactions.length} transactions (most recent 200)</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="No transactions yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
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
                    <TableCell>{t.user.fullName}</TableCell>
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
