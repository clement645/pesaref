'use client';

import { useFormState } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateUserStatusAction } from '@/lib/actions/admin-user.actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserStatus } from '@prisma/client';

const initialState = { success: false as const, error: '' };

const ACTIONS: Array<{ status: UserStatus; label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = [
  { status: 'ACTIVE', label: 'Reactivate', variant: 'default' },
  { status: 'SUSPENDED', label: 'Suspend', variant: 'destructive' },
  { status: 'DEACTIVATED', label: 'Deactivate', variant: 'secondary' },
];

export function UserStatusForm({ userId, currentStatus }: { userId: string; currentStatus: UserStatus }) {
  const [state, formAction] = useFormState(updateUserStatusAction, initialState);

  return (
    <div className="space-y-3">
      {!state.success && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Status updated.</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.filter((a) => a.status !== currentStatus).map((action) => (
          <form key={action.status} action={formAction}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="status" value={action.status} />
            <Button type="submit" variant={action.variant} size="sm">
              {action.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
