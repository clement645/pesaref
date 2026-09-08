import Link from 'next/link';
import { ArrowDownToLine } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { WithdrawalStatusBadge } from '@/components/status-badge';
import type { Prisma, WithdrawalStatus } from '@prisma/client';

export const metadata = { title: 'Withdrawals - PesaRef Admin' };

const STATUS_OPTIONS: WithdrawalStatus[] = ['PENDING', 'PAID', 'REJECTED', 'CANCELLED'];

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status && STATUS_OPTIONS.includes(searchParams.status as WithdrawalStatus) ? (searchParams.status as WithdrawalStatus) : undefined;
  const where: Prisma.WithdrawalWhereInput = status ? { status } : {};

  const withdrawals = await prisma.withdrawal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 150,
    include: { user: { select: { fullName: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawals</h1>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="flex items-end gap-3">
            <div className="w-56">
              <label className="text-xs text-muted-foreground">Status</label>
              <select name="status" defaultValue={status ?? ''} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-10 rounded-md bg-secondary px-4 text-sm font-medium">Filter</button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{withdrawals.length} withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <EmptyState icon={ArrowDownToLine} title="No withdrawals found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.user.fullName}</TableCell>
                    <TableCell>{formatPhoneForDisplay(w.phone)}</TableCell>
                    <TableCell>{formatKES(w.amount)}</TableCell>
                    <TableCell className="whitespace-nowrap">{w.createdAt.toLocaleDateString('en-KE')}</TableCell>
                    <TableCell>
                      <WithdrawalStatusBadge status={w.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/withdrawals/${w.id}`} className="text-sm font-medium text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
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
