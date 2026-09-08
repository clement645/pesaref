import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResetPasswordForm } from './reset-password-form';

export const metadata = { title: 'Reset Password - PesaRef' };

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Alert variant="destructive">
            <AlertDescription>This password reset link is missing its token. Please request a new one.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
