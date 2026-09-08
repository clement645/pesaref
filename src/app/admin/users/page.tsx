import Link from 'next/link';
import { Users } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { UserStatusBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import type { Prisma } from '@prisma/client';

export const metadata = { title: 'Manage Users - PesaRef Admin' };

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim();

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { referralCode: { contains: query, mode: 'insensitive' } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { wallet: { select: { availableBalance: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <form className="w-full max-w-sm">
          <Input name="q" placeholder="Search by name, email, phone, referral code" defaultValue={query} />
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{users.length} users found</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/admin/users/${u.id}`} className="hover:underline">
                        {u.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{u.referralCode}</p>
                    </TableCell>
                    <TableCell>
                      <p>{u.email}</p>
                      <p className="text-xs text-muted-foreground">{formatPhoneForDisplay(u.phone)}</p>
                    </TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <UserStatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      KSh {(u.wallet?.availableBalance ?? 0).toLocaleString('en-KE')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{u.createdAt.toLocaleDateString('en-KE')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
