'use client';

import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { approvePaymentAction, rejectPaymentAction } from '@/lib/actions/admin-payment.actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const initialState = { success: false as const, error: '' };

export function ApprovePaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useFormState(approvePaymentAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Payment approved. The user has been activated and any eligible referral commission has been credited.</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="paymentId" value={paymentId} />
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="adminNote">Admin note (optional)</Label>
        <Textarea id="adminNote" name="adminNote" rows={2} />
      </div>
      <SubmitButton className="w-full">Approve Payment</SubmitButton>
    </form>
  );
}

export function RejectPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useFormState(rejectPaymentAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Payment rejected. The member has been notified.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">Reject Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this payment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="paymentId" value={paymentId} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="rejectionReason">Rejection reason</Label>
            <Textarea id="rejectionReason" name="rejectionReason" rows={3} required placeholder="e.g. Transaction reference could not be verified" />
          </div>
          <DialogFooter>
            <SubmitButton variant="destructive">Confirm rejection</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
