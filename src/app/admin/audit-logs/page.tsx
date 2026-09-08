import { ScrollText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Audit Logs - PesaRef Admin' };

export default async function AdminAuditLogsPage({ searchParams }: { searchParams: { action?: string } }) {
  const where = searchParams.action ? { action: { contains: searchParams.action, mode: 'insensitive' as const } } : {};

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { actor: { select: { fullName: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit logs</h1>
      <p className="text-sm text-muted-foreground">
        Immutable record of every sensitive administrative and financial action taken on the platform.
      </p>

      <Card>
        <CardContent className="pt-6">
          <form method="get" className="flex items-end gap-3">
            <div className="w-64">
              <label className="text-xs text-muted-foreground">Filter by action</label>
              <input
                name="action"
                defaultValue={searchParams.action}
                placeholder="e.g. PAYMENT_APPROVED"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <button type="submit" className="h-10 rounded-md bg-secondary px-4 text-sm font-medium">Filter</button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{logs.length} entries (most recent 200)</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState icon={ScrollText} title="No audit entries found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{log.createdAt.toLocaleString('en-KE')}</TableCell>
                    <TableCell>{log.actor?.fullName ?? 'System'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                    </TableCell>
                    <TableCell>{log.ipAddress ?? '-'}</TableCell>
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
