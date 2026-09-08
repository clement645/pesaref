'use client';

import { Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { markAllNotificationsReadAction } from '@/lib/actions/notification.actions';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export function NotificationBell({ notifications, unreadCount }: { notifications: NotificationItem[]; unreadCount: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-muted" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>Notifications</DialogTitle>
          {unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="ghost" size="sm">
                Mark all as read
              </Button>
            </form>
          )}
        </DialogHeader>
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications yet" description="You'll see updates about payments, referrals, and withdrawals here." />
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`rounded-lg border p-3 text-sm ${n.readAt ? 'border-border' : 'border-primary/40 bg-primary/5'}`}>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString('en-KE')}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
