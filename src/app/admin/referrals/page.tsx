import { Share2 } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ReferralStatusBadge } from '@/components/status-badge';
import type { Prisma, ReferralStatus } from '@prisma/client';

export const metadata = { title: 'Referrals - PesaRef Admin' };

const STATUS_OPTIONS: ReferralStatus[] = ['REGISTERED', 'PAYMENT_PENDING', 'QUALIFIED', 'COMMISSIONED', 'CANCELLED'];

export default async function AdminReferralsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status && STATUS_OPTIONS.includes(searchParams.status as ReferralStatus) ? (searchParams.status as ReferralStatus) : undefined;
  const where: Prisma.ReferralWhereInput = status ? { status } : {};

  const referrals = await prisma.referral.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 150,
    include: {
      referrer: { select: { fullName: true, referralCode: true } },
      referred: { select: { fullName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Referrals</h1>

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
          <CardTitle>{referrals.length} referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <EmptyState icon={Share2} title="No referrals found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred user</TableHead>
                  <TableHead>Code used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.referrer.fullName}</TableCell>
                    <TableCell>{r.referred.fullName}</TableCell>
                    <TableCell>{r.referralCodeUsed}</TableCell>
                    <TableCell>
                      <ReferralStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">{r.commissionAmount ? formatKES(r.commissionAmount) : '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.createdAt.toLocaleDateString('en-KE')}</TableCell>
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
