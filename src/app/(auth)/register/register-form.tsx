'use client';

import { useFormState } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { registerAction } from '@/lib/actions/auth.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const initialState = { success: false as const, error: '' };

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? '';
  const [state, formAction] = useFormState(registerAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.push('/payment');
    }
  }, [state, router]);

  const fieldErrors = !state.success ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-4">
      {!state.success && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required autoComplete="name" />
        {fieldErrors.fullName && <p className="text-xs text-destructive">{fieldErrors.fullName[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" placeholder="0712345678" required autoComplete="tel" />
        {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referralCode">Referral code (optional)</Label>
        <Input id="referralCode" name="referralCode" defaultValue={refCode} placeholder="e.g. SIMON82KQ" />
        {fieldErrors.referralCode && <p className="text-xs text-destructive">{fieldErrors.referralCode[0]}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="underline">Terms &amp; Conditions</Link> and{' '}
        <Link href="/privacy" className="underline">Privacy Policy</Link>, including the registration
        fee and referral commission terms described there.
      </p>

      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
