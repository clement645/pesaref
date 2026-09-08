import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserStatusBadge, PaymentStatusBadge, WithdrawalStatusBadge, ReferralStatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { UserStatusForm } from './user-status-form';
import { WalletAdjustmentForm } from './wallet-adjustment-form';

export const metadata = { title: 'User Detail - PesaRef Admin' };

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      wallet: true,
      payments: { orderBy: { createdAt: 'desc' } },
      withdrawals: { orderBy: { createdAt: 'desc' } },
      referralsAsReferrer: { include: { referred: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } },
      referredBy: { select: { fullName: true, referralCode: true } },
    },
  });

  if (!user) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'User', entityId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold">{user.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} - {formatPhoneForDisplay(user.phone)}
          </p>
          {user.referredBy && (
            <p className="text-xs text-muted-foreground">Referred by {user.referredBy.fullName} ({user.referredBy.referralCode})</p>
          )}
        </div>
        <UserStatusBadge status={user.status} />
      </div>

      {user.role === 'USER' && (
        <Card>
          <CardHeader>
            <CardTitle>Account status</CardTitle>
          </CardHeader>
          <CardContent>
            <UserStatusForm userId={user.id} currentStatus={user.status} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-lg font-bold">{formatKES(user.wallet?.availableBalance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total earned</p>
            <p className="text-lg font-bold">{formatKES(user.wallet?.totalEarned ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Pending withdrawal</p>
            <p className="text-lg font-bold">{formatKES(user.wallet?.pendingWithdrawal ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total withdrawn</p>
            <p className="text-lg font-bold">{formatKES(user.wallet?.totalWithdrawn ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {admin.role === 'SUPER_ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Manual wallet adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <WalletAdjustmentForm userId={user.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {user.payments.length === 0 ? (
            <EmptyState title="No payments submitted" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.createdAt.toLocaleDateString('en-KE')}</TableCell>
                    <TableCell>{p.paymentReference}</TableCell>
                    <TableCell>{formatKES(p.amount)}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral history</CardTitle>
        </CardHeader>
        <CardContent>
          {user.referralsAsReferrer.length === 0 ? (
            <EmptyState title="No referrals made" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referred user</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.referralsAsReferrer.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.referred.fullName}</TableCell>
                    <TableCell>
                      <ReferralStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{r.commissionAmount ? formatKES(r.commissionAmount) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {user.withdrawals.length === 0 ? (
            <EmptyState title="No withdrawals requested" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.createdAt.toLocaleDateString('en-KE')}</TableCell>
                    <TableCell>{formatKES(w.amount)}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <EmptyState title="No audit entries for this user" />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2">
                  <span>{log.action}</span>
                  <span className="text-xs text-muted-foreground">{log.createdAt.toLocaleString('en-KE')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
