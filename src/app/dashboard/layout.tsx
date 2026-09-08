import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NotificationBell } from '@/components/notification-bell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirectTo=/dashboard');
  if (user.status === 'DEACTIVATED') redirect('/login?error=deactivated');

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <DashboardShell
      topRight={
        <NotificationBell
          notifications={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt.toISOString(),
            readAt: n.readAt?.toISOString() ?? null,
          }))}
          unreadCount={unreadCount}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
