import Link from 'next/link';
import { Wallet, TrendingUp, Clock, Banknote, Users, ArrowRight } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getUserDashboardData } from '@/lib/services/dashboard.service';
import { buildReferralLink } from '@/lib/utils/app-url';
import { formatKES } from '@/lib/utils/money';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyLinkButton } from '@/components/copy-link-button';
import { EmptyState } from '@/components/ui/empty-state';
import { UserStatusBadge, PaymentStatusBadge, ReferralStatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Dashboard - PesaRef' };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getUserDashboardData(user.id);
  const referralLink = buildReferralLink(user.referralCode);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Welcome back, {user.fullName.split(' ')[0]}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Account status: <UserStatusBadge status={user.status} />
        </div>
      </div>

      {user.status === 'PENDING_PAYMENT' && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Complete your registration payment</AlertTitle>
          <AlertDescription>
            Your account is not active yet. Submit your registration payment to unlock referrals,
            wallet earnings, and withdrawals.{' '}
            <Link href="/payment" className="font-medium underline">
              Go to payment page
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {user.status === 'SUSPENDED' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Account suspended</AlertTitle>
          <AlertDescription>
            Your account is suspended. You cannot refer new members, request withdrawals, or earn
            commissions until this is resolved. Please contact support.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available balance" value={formatKES(data.wallet?.availableBalance ?? 0)} icon={Wallet} tone="success" />
        <StatCard label="Total earned" value={formatKES(data.wallet?.totalEarned ?? 0)} icon={TrendingUp} />
        <StatCard label="Pending withdrawal" value={formatKES(data.wallet?.pendingWithdrawal ?? 0)} icon={Clock} tone="warning" />
        <StatCard label="Total withdrawn" value={formatKES(data.wallet?.totalWithdrawn ?? 0)} icon={Banknote} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">{referralLink}</code>
            <CopyLinkButton value={referralLink} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center sm:max-w-md">
            <div>
              <p className="text-lg font-bold">{data.totalReferred}</p>
              <p className="text-xs text-muted-foreground">People referred</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">{data.successfulReferrals}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">{data.pendingReferrals}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/wallet">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <EmptyState icon={Wallet} title="No transactions yet" />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentTransactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.createdAt.toLocaleDateString('en-KE')}</p>
                    </div>
                    <span className={t.amount >= 0 ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
                      {t.amount >= 0 ? '+' : ''}
                      {formatKES(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent referrals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/referrals">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentReferrals.length === 0 ? (
              <EmptyState icon={Users} title="No referrals yet" description="Share your referral link to start earning." />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentReferrals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{r.referred.fullName}</p>
                      <p className="text-xs text-muted-foreground">{r.createdAt.toLocaleDateString('en-KE')}</p>
                    </div>
                    <ReferralStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data.latestPayment && (
        <Card>
          <CardHeader>
            <CardTitle>Registration payment status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <span>Reference: {data.latestPayment.paymentReference}</span>
            <PaymentStatusBadge status={data.latestPayment.status} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
