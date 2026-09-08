'use client';

import { useFormState } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { loginAction } from '@/lib/actions/auth.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const initialState = { success: false as const, error: '' };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useFormState(loginAction, initialState);

  useEffect(() => {
    if (state.success) {
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo);
      } else if (state.data.role === 'ADMIN' || state.data.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    }
  }, [state, router, searchParams]);

  return (
    <form action={formAction} className="space-y-4">
      {!state.success && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      <SubmitButton className="w-full">Log in</SubmitButton>
    </form>
  );
}
