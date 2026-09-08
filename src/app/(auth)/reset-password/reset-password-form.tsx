'use client';

import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPasswordAction } from '@/lib/actions/auth.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState(resetPasswordAction, initialState);

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => router.push('/login'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [state, router]);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Your password has been reset. Redirecting you to log in...</AlertDescription>
      </Alert>
    );
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>}
      </div>
      <SubmitButton className="w-full">Reset password</SubmitButton>
    </form>
  );
}
