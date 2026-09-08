import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Privacy Policy - PesaRef' };

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: draft version - not yet legally reviewed.</p>

      <Alert variant="warning" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Legal review required</AlertTitle>
        <AlertDescription>
          This document is a plain-language placeholder. It must be reviewed by a qualified Kenyan
          lawyer for compliance with the Data Protection Act, 2019, before production launch.
        </AlertDescription>
      </Alert>

      <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
          <p>
            We collect your full name, email address, phone number, and a securely hashed password
            when you register. We also record payment references, withdrawal M-Pesa numbers, and
            referral activity you generate on the platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">How we use your information</h2>
          <p>
            Your information is used to operate your account, verify registration and withdrawal
            payments, calculate referral commissions, communicate with you about your account, and
            maintain audit records required for financial accountability.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Data security</h2>
          <p>
            Passwords are hashed using industry-standard algorithms and are never stored or
            transmitted in plain text. Access to administrative functions is restricted by role and
            every sensitive administrative action is logged.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Data retention</h2>
          <p>
            Financial and audit records are retained for as long as necessary to meet legal,
            accounting, and dispute-resolution obligations.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data, subject to
            our legal obligation to retain financial records. Contact support to make a request.
          </p>
        </section>
      </div>
    </div>
  );
}
