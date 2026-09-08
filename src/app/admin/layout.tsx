import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AdminShell } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirectTo=/admin');
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') redirect('/dashboard?error=forbidden');

  return (
    <AdminShell
      topRight={
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{user.fullName}</span>
          <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>{user.role.replace('_', ' ')}</Badge>
        </div>
      }
    >
      {children}
    </AdminShell>
  );
}
