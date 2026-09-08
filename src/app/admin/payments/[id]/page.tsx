import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentStatusBadge, ReferralStatusBadge } from '@/components/status-badge';
import { ApprovePaymentForm, RejectPaymentForm } from './payment-review-form';

export const metadata = { title: 'Payment Detail - PesaRef Admin' };

export default async function AdminPaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, fullName: true, email: true, referredBy: { select: { fullName: true, referralCode: true } } } },
      referral: true,
      reviewedBy: { select: { fullName: true } },
    },
  });

  if (!payment) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment review</h1>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">User</p>
            <Link href={`/admin/users/${payment.user.id}`} className="font-medium hover:underline">
              {payment.user.fullName}
            </Link>
            <p className="text-xs text-muted-foreground">{payment.user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-medium">{formatKES(payment.amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Transaction reference</p>
            <p className="font-medium">{payment.paymentReference}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment phone</p>
            <p className="font-medium">{formatPhoneForDisplay(payment.paymentPhone)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment date</p>
            <p className="font-medium">{payment.paymentDate.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Submitted</p>
            <p className="font-medium">{payment.createdAt.toLocaleString('en-KE')}</p>
          </div>
          {payment.user.referredBy && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Referral information</p>
              <p className="font-medium">
                Referred by {payment.user.referredBy.fullName} ({payment.user.referredBy.referralCode})
              </p>
              {payment.referral && (
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  Referral status: <ReferralStatusBadge status={payment.referral.status} />
                </p>
              )}
            </div>
          )}
          {payment.reviewedBy && (
            <div className="sm:col-span-2 border-t border-border pt-3">
              <p className="text-muted-foreground">Reviewed by {payment.reviewedBy.fullName} on {payment.reviewedAt?.toLocaleString('en-KE')}</p>
              {payment.adminNote && <p className="mt-1">Note: {payment.adminNote}</p>}
              {payment.rejectionReason && <p className="mt-1 text-destructive">Reason: {payment.rejectionReason}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {payment.status === 'PENDING' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approve</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovePaymentForm paymentId={payment.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reject</CardTitle>
            </CardHeader>
            <CardContent>
              <RejectPaymentForm paymentId={payment.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
