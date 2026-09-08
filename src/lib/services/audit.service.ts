import 'server-only';
import type { Prisma, PrismaClient } from '@prisma/client';

type TxClient = PrismaClient | Prisma.TransactionClient;

export interface AuditContext {
  actorId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAuditLog(
  tx: TxClient,
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
  } & AuditContext
): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: params.actorId ?? undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue === undefined ? undefined : (params.oldValue as Prisma.InputJsonValue),
      newValue: params.newValue === undefined ? undefined : (params.newValue as Prisma.InputJsonValue),
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
    },
  });
}
