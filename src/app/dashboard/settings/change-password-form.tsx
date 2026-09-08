'use client';

import { useFormState } from 'react-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { changePasswordAction } from '@/lib/actions/profile.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);
  const fieldErrors = !state.success ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-4">
      {!state.success && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Password changed successfully.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
        {fieldErrors.currentPassword && <p className="text-xs text-destructive">{fieldErrors.currentPassword[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" required autoComplete="new-password" />
        {fieldErrors.newPassword && <p className="text-xs text-destructive">{fieldErrors.newPassword[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>}
      </div>

      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}
