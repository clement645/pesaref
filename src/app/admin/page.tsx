import { Users, UserCheck, Clock, CheckCircle2, Coins, ArrowDownToLine, Banknote, Send } from 'lucide-react';
import { getAdminDashboardData } from '@/lib/services/admin-dashboard.service';
import { formatKES } from '@/lib/utils/money';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardChart } from '@/components/admin/dashboard-chart';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Admin Dashboard - PesaRef' };

const ACTIVITY_LABELS: Record<string, string> = {
  USER_REGISTERED: 'New registration',
  PAYMENT_APPROVED: 'Payment approved',
  REFERRAL_COMMISSIONED: 'New referral commission',
  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  WITHDRAWAL_APPROVED: 'Withdrawal paid',
};

export default async function AdminDashboardPage() {
  const { cards, charts, recentActivity } = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={cards.totalUsers} icon={Users} />
        <StatCard label="Active users" value={cards.activeUsers} icon={UserCheck} tone="success" />
        <StatCard label="Pending payments" value={cards.pendingPayments} icon={Clock} tone="warning" />
        <StatCard label="Approved payments" value={cards.approvedPayments} icon={CheckCircle2} tone="success" />
        <StatCard label="Total referral commissions" value={formatKES(cards.totalCommissions)} icon={Coins} />
        <StatCard label="Pending withdrawals" value={cards.pendingWithdrawals} icon={ArrowDownToLine} tone="warning" />
        <StatCard label="Paid withdrawals" value={cards.paidWithdrawals} icon={Send} tone="success" />
        <StatCard label="Total amount withdrawn" value={formatKES(cards.totalWithdrawn)} icon={Banknote} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrations (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={charts.registrations} color="#0f766e" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved payments (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={charts.approvedPayments} color="#2563eb" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Referral commissions (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={charts.commissions} color="#d97706" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Withdrawals (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={charts.withdrawals} color="#dc2626" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{ACTIVITY_LABELS[log.action] ?? log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.actor?.fullName ?? 'System'}</p>
                  </div>
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
