import Link from 'next/link';
import { ArrowRight, ShieldCheck, Users, Wallet, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRegistrationFee, getReferralCommission } from '@/lib/services/settings.service';
import { formatKES } from '@/lib/utils/money';

export default async function HomePage() {
  const [fee, commission] = await Promise.all([getRegistrationFee(), getReferralCommission()]);

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container flex flex-col items-center gap-6 py-20 text-center">
          <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            A transparent referral management platform for Kenya
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Register once. Refer people you trust. Track every shilling.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            PesaRef charges a one-time {formatKES(fee)} registration/service fee. When someone you
            refer registers and completes their own registration payment, you earn a{' '}
            {formatKES(commission)} referral commission - verified manually and paid out to you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle>Register &amp; get a referral code</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Every registered member receives a unique referral code and shareable link the moment
              their account is created.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="h-8 w-8 text-primary" />
              <CardTitle>Manually verified payments</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Registration payments are reviewed and approved by our team before an account becomes
              active - no automatic self-activation.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Wallet className="h-8 w-8 text-primary" />
              <CardTitle>Clear wallet &amp; withdrawals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Track your available balance, pending withdrawals, and full transaction history at any
              time. Withdrawals are paid out manually via M-Pesa.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold">Important: earnings are not guaranteed</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Referral commissions are only credited after a referred person&apos;s registration
              payment is independently verified and approved. PesaRef does not promise a fixed income
              and does not operate a multi-level referral scheme - each member is rewarded for at most
              one level of direct referrals.
            </p>
          </div>
          <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-sm">
            {[
              `A one-time ${formatKES(fee)} registration/service fee covers your account activation.`,
              `You earn ${formatKES(commission)} only when someone you referred is verified and activated.`,
              'Commissions are one-level only - there is no recruiting-of-recruiters payout.',
              'Withdrawals are reviewed and paid out manually by an administrator.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
