import { Users } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { buildReferralLink } from '@/lib/utils/app-url';
import { formatKES } from '@/lib/utils/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { CopyLinkButton } from '@/components/copy-link-button';
import { ReferralStatusBadge, PaymentStatusBadge } from '@/components/status-badge';

export const metadata = { title: 'Referrals - PesaRef' };

export default async function ReferralsPage() {
  const user = await requireUser();
  const referralLink = buildReferralLink(user.referralCode);

  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      referred: { select: { fullName: true, createdAt: true } },
      qualifyingPayment: { select: { status: true } },
    },
  });

  const totalCommission = referrals.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your referrals</h1>
        <p className="text-sm text-muted-foreground">
          Referral code: <span className="font-mono font-semibold">{user.referralCode}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Share your link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">{referralLink}</code>
          <CopyLinkButton value={referralLink} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 sm:max-w-md">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Total referred</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold text-success">{referrals.filter((r) => r.status === 'COMMISSIONED').length}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold">{formatKES(totalCommission)}</p>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral history</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <EmptyState icon={Users} title="No referrals yet" description="Share your referral link above to start earning commissions." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Registration date</TableHead>
                  <TableHead>Payment status</TableHead>
                  <TableHead>Referral status</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.referred.fullName}</TableCell>
                    <TableCell>{r.referred.createdAt.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>
                      {r.qualifyingPayment ? <PaymentStatusBadge status={r.qualifyingPayment.status} /> : <span className="text-xs text-muted-foreground">Not submitted</span>}
                    </TableCell>
                    <TableCell>
                      <ReferralStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {r.commissionAmount ? formatKES(r.commissionAmount) : '-'}
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
