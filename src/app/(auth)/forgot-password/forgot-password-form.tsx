'use client';

import { useFormState } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { forgotPasswordAction } from '@/lib/actions/auth.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </form>
  );
}
