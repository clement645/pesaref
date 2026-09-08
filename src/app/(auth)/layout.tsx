import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold text-primary">
        <Wallet className="h-6 w-6" />
        PesaRef
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
