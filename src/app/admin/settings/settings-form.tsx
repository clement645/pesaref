'use client';

import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateSettingsAction } from '@/lib/actions/admin-user.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, formAction] = useFormState(updateSettingsAction, initialState);
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
          <AlertDescription>Settings updated.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="registrationFeeKes">Registration fee (KSh)</Label>
          <Input id="registrationFeeKes" name="registrationFeeKes" type="number" defaultValue={settings.registrationFeeKes} required />
          {fieldErrors.registrationFeeKes && <p className="text-xs text-destructive">{fieldErrors.registrationFeeKes[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="referralCommissionKes">Referral commission (KSh)</Label>
          <Input id="referralCommissionKes" name="referralCommissionKes" type="number" defaultValue={settings.referralCommissionKes} required />
          {fieldErrors.referralCommissionKes && <p className="text-xs text-destructive">{fieldErrors.referralCommissionKes[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minWithdrawalKes">Minimum withdrawal (KSh)</Label>
          <Input id="minWithdrawalKes" name="minWithdrawalKes" type="number" defaultValue={settings.minWithdrawalKes} required />
          {fieldErrors.minWithdrawalKes && <p className="text-xs text-destructive">{fieldErrors.minWithdrawalKes[0]}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="platformName">Platform name</Label>
          <Input id="platformName" name="platformName" defaultValue={settings.platformName} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supportEmail">Support email</Label>
          <Input id="supportEmail" name="supportEmail" type="email" defaultValue={settings.supportEmail} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supportPhone">Support phone</Label>
          <Input id="supportPhone" name="supportPhone" defaultValue={settings.supportPhone} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="paymentInstructions">Payment instructions</Label>
        <Textarea id="paymentInstructions" name="paymentInstructions" rows={4} defaultValue={settings.paymentInstructions} required />
        {fieldErrors.paymentInstructions && <p className="text-xs text-destructive">{fieldErrors.paymentInstructions[0]}</p>}
      </div>

      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}
