'use client';

import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { markWithdrawalPaidAction, rejectWithdrawalAction } from '@/lib/actions/admin-withdrawal.actions';
import { REJECTION_REASONS } from '@/lib/validations/withdrawal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatKES } from '@/lib/utils/money';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

const initialState = { success: false as const, error: '' };

export function MarkPaidForm({
  withdrawalId,
  userName,
  phone,
  amount,
}: {
  withdrawalId: string;
  userName: string;
  phone: string;
  amount: number;
}) {
  const [state, formAction] = useFormState(markWithdrawalPaidAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Withdrawal marked as PAID. The member has been notified.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">Mark as Paid</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm payment</DialogTitle>
          <DialogDescription>Confirm you have sent this amount via M-Pesa before marking it paid.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="withdrawalId" value={withdrawalId} />
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p>User: <strong>{userName}</strong></p>
            <p>Phone: <strong>{formatPhoneForDisplay(phone)}</strong></p>
            <p>Amount: <strong>{formatKES(amount)}</strong></p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mpesaReference">M-Pesa transaction reference</Label>
            <Input id="mpesaReference" name="mpesaReference" required placeholder="e.g. QFT1AB2C3D" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adminNote">Admin note</Label>
            <Textarea id="adminNote" name="adminNote" rows={2} />
          </div>
          <DialogFooter>
            <SubmitButton>Confirm Payment</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RejectWithdrawalForm({ withdrawalId }: { withdrawalId: string }) {
  const [state, formAction] = useFormState(rejectWithdrawalAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Withdrawal rejected and funds released back to the member&apos;s available balance.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">Reject</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this withdrawal</DialogTitle>
          <DialogDescription>The reserved amount will be returned to the member&apos;s available balance.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="withdrawalId" value={withdrawalId} />
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="rejectionReason">Rejection reason</Label>
            <select id="rejectionReason" name="rejectionReason" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select a reason</option>
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adminNote">Admin note (optional)</Label>
            <Textarea id="adminNote" name="adminNote" rows={2} />
          </div>
          <DialogFooter>
            <SubmitButton variant="destructive">Confirm rejection</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
