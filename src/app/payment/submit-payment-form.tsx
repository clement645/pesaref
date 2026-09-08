'use client';

import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { submitPaymentAction } from '@/lib/actions/payment.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function SubmitPaymentForm() {
  const [state, formAction] = useFormState(submitPaymentAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Payment submitted. <strong>Payment verification is pending</strong> - an administrator will
          review your reference and activate your account once it is confirmed. This page will
          reflect your status once approved.
        </AlertDescription>
      </Alert>
    );
  }

  const fieldErrors = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="paymentReference">M-Pesa transaction reference</Label>
        <Input id="paymentReference" name="paymentReference" placeholder="e.g. QFT1AB2C3D" required />
        {fieldErrors.paymentReference && <p className="text-xs text-destructive">{fieldErrors.paymentReference[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paymentPhone">Phone number used to pay</Label>
        <Input id="paymentPhone" name="paymentPhone" placeholder="0712345678" required />
        {fieldErrors.paymentPhone && <p className="text-xs text-destructive">{fieldErrors.paymentPhone[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paymentDate">Payment date</Label>
        <Input id="paymentDate" name="paymentDate" type="date" max={today} required />
        {fieldErrors.paymentDate && <p className="text-xs text-destructive">{fieldErrors.paymentDate[0]}</p>}
      </div>

      <SubmitButton className="w-full">Submit payment</SubmitButton>
    </form>
  );
}
