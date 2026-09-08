import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getRegistrationFee, getSetting, SETTING_KEYS } from '@/lib/services/settings.service';
import { formatKES } from '@/lib/utils/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentStatusBadge } from '@/components/status-badge';
import { SubmitPaymentForm } from './submit-payment-form';

export const metadata = { title: 'Registration Payment - PesaRef' };

export default async function PaymentPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirectTo=/payment');
  if (user.status === 'ACTIVE') redirect('/dashboard');

  const [fee, instructions, latestPayment] = await Promise.all([
    getRegistrationFee(),
    getSetting(SETTING_KEYS.PAYMENT_INSTRUCTIONS),
    prisma.payment.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold text-primary">
        <Wallet className="h-6 w-6" />
        PesaRef
      </Link>

      <div className="w-full max-w-lg space-y-6">
        {user.status === 'SUSPENDED' && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">
              Your account is currently suspended. Please contact support before submitting a payment.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Registration Fee: {formatKES(fee)}</CardTitle>
            <CardDescription>Complete this one-time payment to activate your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{instructions}</div>

            {latestPayment && latestPayment.status === 'PENDING' ? (
              <div className="space-y-2 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your latest submission</span>
                  <PaymentStatusBadge status={latestPayment.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Reference: {latestPayment.paymentReference} - submitted{' '}
                  {latestPayment.createdAt.toLocaleDateString('en-KE')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment verification is pending. We will update your account status as soon as an
                  administrator reviews it.
                </p>
              </div>
            ) : (
              <>
                {latestPayment && latestPayment.status === 'REJECTED' && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    Your previous payment was rejected
                    {latestPayment.rejectionReason ? `: ${latestPayment.rejectionReason}` : '.'} Please
                    submit a new, valid payment reference below.
                  </div>
                )}
                <SubmitPaymentForm />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
