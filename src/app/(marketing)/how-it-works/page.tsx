import { getRegistrationFee, getReferralCommission, getMinWithdrawal } from '@/lib/services/settings.service';
import { formatKES } from '@/lib/utils/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'How It Works - PesaRef' };

export default async function HowItWorksPage() {
  const [fee, commission, minWithdrawal] = await Promise.all([
    getRegistrationFee(),
    getReferralCommission(),
    getMinWithdrawal(),
  ]);

  const steps = [
    {
      title: '1. Create your account',
      body: 'Sign up with your name, email, phone number, and password. If someone referred you, their referral code is applied automatically from the link.',
    },
    {
      title: `2. Pay the ${formatKES(fee)} registration fee`,
      body: `This one-time fee activates your account and unlocks the referral program. Follow the payment instructions shown on the payment page, then submit your M-Pesa transaction reference.`,
    },
    {
      title: '3. Wait for manual verification',
      body: 'An administrator reviews your payment reference and approves or rejects it. Your account only becomes ACTIVE once a payment is approved - this protects everyone on the platform.',
    },
    {
      title: '4. Share your referral link',
      body: 'Once active, you get a unique referral code and link. Share it with people you know.',
    },
    {
      title: `5. Earn ${formatKES(commission)} per verified referral`,
      body: `When someone you referred registers and their own ${formatKES(fee)} payment is approved, you automatically receive a ${formatKES(commission)} commission in your wallet. This is a one-level system only - you do not earn from your referrals' referrals.`,
    },
    {
      title: `6. Withdraw your earnings`,
      body: `Once your available balance is at least ${formatKES(minWithdrawal)}, request a withdrawal to your M-Pesa number. The amount is reserved immediately and paid out manually once an administrator confirms the M-Pesa transaction.`,
    },
  ];

  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold">How PesaRef Works</h1>
      <p className="mt-3 text-muted-foreground">
        A transparent, one-level referral system with manually verified payments and withdrawals.
      </p>
      <div className="mt-8 grid gap-4">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.body}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
