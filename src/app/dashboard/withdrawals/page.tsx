import { ArrowDownToLine } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getMinWithdrawal } from '@/lib/services/settings.service';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { WithdrawalStatusBadge } from '@/components/status-badge';
import { WithdrawDialog } from '@/components/withdraw-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata = { title: 'Withdrawals - PesaRef' };

export default async function WithdrawalsPage() {
  const user = await requireUser();
  const [wallet, withdrawals, minWithdrawal] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.withdrawal.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    getMinWithdrawal(),
  ]);

  const availableBalance = wallet?.availableBalance ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Withdrawals</h1>
          <p className="text-sm text-muted-foreground">Available balance: {formatKES(availableBalance)}</p>
        </div>
        {user.status === 'ACTIVE' ? (
          <WithdrawDialog availableBalance={availableBalance} minWithdrawal={minWithdrawal} defaultPhone="" />
        ) : (
          <span className="text-sm text-muted-foreground">Withdrawals require an active account.</span>
        )}
      </div>

      {availableBalance < minWithdrawal && user.status === 'ACTIVE' && (
        <Alert>
          <AlertDescription>
            You need at least {formatKES(minWithdrawal)} available to request a withdrawal. Keep
            referring to grow your balance.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <EmptyState icon={ArrowDownToLine} title="No withdrawals yet" description="Once you request a withdrawal, it will appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="whitespace-nowrap">{w.createdAt.toLocaleDateString('en-KE')}</TableCell>
                    <TableCell className="font-semibold">{formatKES(w.amount)}</TableCell>
                    <TableCell>{formatPhoneForDisplay(w.phone)}</TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell>{w.mpesaReference ?? '-'}</TableCell>
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
