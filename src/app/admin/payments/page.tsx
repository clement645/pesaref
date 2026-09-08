import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PaymentStatusBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Prisma, PaymentStatus } from '@prisma/client';

export const metadata = { title: 'Manage Payments - PesaRef Admin' };

const STATUS_OPTIONS: PaymentStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; phone?: string; reference?: string };
}) {
  const status = searchParams.status && STATUS_OPTIONS.includes(searchParams.status as PaymentStatus) ? (searchParams.status as PaymentStatus) : undefined;

  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(searchParams.phone ? { paymentPhone: { contains: searchParams.phone } } : {}),
    ...(searchParams.reference ? { paymentReference: { contains: searchParams.reference, mode: 'insensitive' } } : {}),
  };

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { fullName: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="w-40">
              <label className="text-xs text-muted-foreground">Status</label>
              <select name="status" defaultValue={status ?? ''} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input name="phone" defaultValue={searchParams.phone} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Reference</label>
              <Input name="reference" defaultValue={searchParams.reference} className="mt-1" />
            </div>
            <Button type="submit" variant="secondary">Filter</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{payments.length} payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState icon={CreditCard} title="No payments found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/payments/${p.id}`} className="font-medium hover:underline">
                        {p.user.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.user.email}</p>
                    </TableCell>
                    <TableCell>{p.paymentReference}</TableCell>
                    <TableCell>{formatPhoneForDisplay(p.paymentPhone)}</TableCell>
                    <TableCell>{formatKES(p.amount)}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.createdAt.toLocaleDateString('en-KE')}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant={p.status === 'PENDING' ? 'default' : 'outline'}>
                        <Link href={`/admin/payments/${p.id}`}>{p.status === 'PENDING' ? 'Review' : 'View'}</Link>
                      </Button>
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
