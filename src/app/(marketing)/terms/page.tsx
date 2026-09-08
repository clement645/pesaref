import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getRegistrationFee, getReferralCommission, getMinWithdrawal } from '@/lib/services/settings.service';
import { formatKES } from '@/lib/utils/money';

export const metadata = { title: 'Terms & Conditions - PesaRef' };

export default async function TermsPage() {
  const [fee, commission, minWithdrawal] = await Promise.all([
    getRegistrationFee(),
    getReferralCommission(),
    getMinWithdrawal(),
  ]);

  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: draft version - not yet legally reviewed.</p>

      <Alert variant="warning" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Legal review required</AlertTitle>
        <AlertDescription>
          This document is a plain-language placeholder generated for the initial build of the
          platform. It must be reviewed and finalized by a qualified Kenyan lawyer before the
          platform is used to process real payments.
        </AlertDescription>
      </Alert>

      <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Registration / service fee</h2>
          <p>
            A one-time registration/service fee of {formatKES(fee)} is charged to activate a member
            account and grant access to the platform&apos;s referral tools, dashboard, and support
            services. This fee is for the service of account activation and platform access - it is
            not an investment and does not, by itself, entitle a member to any income.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Referral commission terms</h2>
          <p>
            An active member who refers a new member receives a commission of {formatKES(commission)}{' '}
            only after the new member&apos;s own registration payment has been independently verified
            and approved by an administrator. This is a one-level referral system: no commission is
            paid on referrals made by the people you refer. Commissions are not guaranteed income and
            depend entirely on successfully referring people who complete verified registration
            payments.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Conditions for commission rejection or reversal</h2>
          <p>
            A commission may be withheld, rejected, or reversed if: the qualifying payment is later
            found to be fraudulent or reversed; the referring account is suspended or deactivated for
            violating these terms; the referral relationship is found to involve self-referral or
            manipulation; or the qualifying payment is rejected during manual review.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Withdrawals</h2>
          <p>
            Withdrawals require a minimum available balance of {formatKES(minWithdrawal)} and are
            processed manually via M-Pesa by an administrator. Submitting a withdrawal request
            reserves the requested amount; it is not paid until an administrator confirms the M-Pesa
            transaction and marks the withdrawal as paid. Withdrawal requests may be rejected for
            reasons including invalid payment details, unresolved account verification issues, or
            duplicate requests, in which case the reserved amount is returned to the member&apos;s
            available balance.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Manual payment processing</h2>
          <p>
            All registration and withdrawal payments are currently processed manually. Submitting a
            payment reference does not automatically activate an account or complete a withdrawal -
            manual verification by an administrator is always required.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">6. No guaranteed income</h2>
          <p>
            PesaRef does not promise, guarantee, or represent that any member will earn a specific
            amount of income. Referral earnings depend on a member&apos;s own efforts to refer real
            people who complete verified registration payments.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Account suspension</h2>
          <p>
            Accounts found to be engaging in self-referral, duplicate registrations, payment fraud, or
            other manipulation of the referral system may be suspended or deactivated, and pending
            commissions or withdrawals may be withheld pending investigation.
          </p>
        </section>
      </div>
    </div>
  );
}
