import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from './register-form';

export const metadata = { title: 'Create Account - PesaRef' };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Register to get started with PesaRef.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <RegisterForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
