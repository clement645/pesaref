'use client';

import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { adjustWalletAction } from '@/lib/actions/admin-user.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function WalletAdjustmentForm({ userId }: { userId: string }) {
  const [state, formAction] = useFormState(adjustWalletAction, initialState);
  const fieldErrors = !state.success ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      {!state.success && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Wallet adjusted and logged.</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (KSh, use negative to deduct)</Label>
          <Input id="amount" name="amount" type="number" required />
          {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount[0]}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason (required, always audited)</Label>
        <Textarea id="reason" name="reason" rows={2} required />
        {fieldErrors.reason && <p className="text-xs text-destructive">{fieldErrors.reason[0]}</p>}
      </div>
      <SubmitButton variant="outline">Apply adjustment</SubmitButton>
    </form>
  );
}
