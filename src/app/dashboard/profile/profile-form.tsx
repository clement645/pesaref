'use client';

import { useFormState } from 'react-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { updateProfileAction } from '@/lib/actions/profile.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);
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
          <AlertDescription>Profile updated successfully.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
        {fieldErrors.fullName && <p className="text-xs text-destructive">{fieldErrors.fullName[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" defaultValue={phone} required />
        {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>}
      </div>

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
