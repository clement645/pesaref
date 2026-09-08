'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Share2,
  ArrowDownToLine,
  Receipt,
  ScrollText,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { NavLink } from './nav-link';
import { logoutAction } from '@/lib/actions/auth.actions';

const ADMIN_LINKS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/referrals', icon: Share2, label: 'Referrals' },
  { href: '/admin/withdrawals', icon: ArrowDownToLine, label: 'Withdrawals' },
  { href: '/admin/transactions', icon: Receipt, label: 'Transactions' },
  { href: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminShell({ children, topRight }: { children: React.ReactNode; topRight?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background p-4 md:flex md:flex-col">
        <Link href="/admin" className="mb-6 px-2 text-lg font-bold text-primary">
          PesaRef Admin
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {ADMIN_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="flex h-full w-64 flex-col bg-background p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="text-lg font-bold text-primary">PesaRef Admin</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {ADMIN_LINKS.map((link) => (
                <NavLink key={link.href} {...link} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">{topRight}</div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
