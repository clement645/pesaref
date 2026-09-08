import { getCurrentUser } from '@/lib/auth/session';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated={!!user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
