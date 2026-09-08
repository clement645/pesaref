import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WithdrawalStatusBadge } from '@/components/status-badge';
import { MarkPaidForm, RejectWithdrawalForm } from './withdrawal-review-form';

export const metadata = { title: 'Withdrawal Detail - PesaRef Admin' };

export default async function AdminWithdrawalDetailPage({ params }: { params: { id: string } }) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, fullName: true, email: true, wallet: { select: { availableBalance: true } } } },
      processedBy: { select: { fullName: true } },
    },
  });

  if (!withdrawal) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Withdrawal review</h1>
        <WithdrawalStatusBadge status={withdrawal.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">User</p>
            <Link href={`/admin/users/${withdrawal.user.id}`} className="font-medium hover:underline">
              {withdrawal.user.fullName}
            </Link>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-medium">{formatKES(withdrawal.amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">M-Pesa phone</p>
            <p className="font-medium">{formatPhoneForDisplay(withdrawal.phone)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Requested</p>
            <p className="font-medium">{withdrawal.createdAt.toLocaleString('en-KE')}</p>
          </div>
          {withdrawal.note && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Member note</p>
              <p className="font-medium">{withdrawal.note}</p>
            </div>
          )}
          {withdrawal.processedBy && (
            <div className="sm:col-span-2 border-t border-border pt-3">
              <p className="text-muted-foreground">
                Processed by {withdrawal.processedBy.fullName} on {withdrawal.processedAt?.toLocaleString('en-KE')}
              </p>
              {withdrawal.mpesaReference && <p className="mt-1">M-Pesa reference: {withdrawal.mpesaReference}</p>}
              {withdrawal.adminNote && <p className="mt-1">Note: {withdrawal.adminNote}</p>}
              {withdrawal.rejectionReason && <p className="mt-1 text-destructive">Reason: {withdrawal.rejectionReason}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {withdrawal.status === 'PENDING' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <MarkPaidForm withdrawalId={withdrawal.id} userName={withdrawal.user.fullName} phone={withdrawal.phone} amount={withdrawal.amount} />
          <RejectWithdrawalForm withdrawalId={withdrawal.id} />
        </div>
      )}
    </div>
  );
}
