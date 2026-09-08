import type { Metadata } from 'next';
import './globals.css';
import { ToastContextProvider } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'PesaRef - Referral Management Platform',
  description: 'Register, refer, and track your referral earnings with PesaRef.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <ToastContextProvider>
          {children}
          <Toaster />
        </ToastContextProvider>
      </body>
    </html>
  );
}
