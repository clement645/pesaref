'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestWithdrawalAction } from '@/lib/actions/withdrawal.actions';
import { formatKES } from '@/lib/utils/money';

const initialState = { success: false as const, error: '' };

export function WithdrawDialog({ availableBalance, minWithdrawal, defaultPhone }: { availableBalance: number; minWithdrawal: number; defaultPhone: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [state, formAction] = useFormState(requestWithdrawalAction, initialState);

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => {
        setOpen(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  const canWithdraw = availableBalance >= minWithdrawal;
  const fieldErrors = !state.success ? state.fieldErrors ?? {} : {};

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setAmount('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={!canWithdraw}>Withdraw Funds</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a withdrawal</DialogTitle>
          <DialogDescription>
            Available balance: <strong>{formatKES(availableBalance)}</strong>. Minimum withdrawal: {formatKES(minWithdrawal)}.
          </DialogDescription>
        </DialogHeader>

        {state.success ? (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Withdrawal requested. Your funds have been reserved and the request is now{' '}
              <strong>PENDING</strong> admin review.
            </AlertDescription>
          </Alert>
        ) : (
          <form action={formAction} className="space-y-4">
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (KSh)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={minWithdrawal}
                max={availableBalance}
                step={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">M-Pesa phone number</Label>
              <Input id="phone" name="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" name="note" rows={2} />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount requested</span>
                <span className="font-medium">{amount ? formatKES(Number(amount)) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment phone number</span>
                <span className="font-medium">{phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available balance</span>
                <span className="font-medium">{formatKES(availableBalance)}</span>
              </div>
            </div>

            <DialogFooter>
              <SubmitButton>Submit withdrawal request</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
