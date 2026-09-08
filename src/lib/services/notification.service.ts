import 'server-only';
import type { Prisma, PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

type TxClient = PrismaClient | Prisma.TransactionClient;

export type NotificationType =
  | 'REGISTRATION_COMPLETED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'REFERRAL_QUALIFIED'
  | 'COMMISSION_EARNED'
  | 'WITHDRAWAL_SUBMITTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED';

export async function createNotification(
  tx: TxClient,
  params: { userId: string; type: NotificationType; title: string; message: string }
): Promise<void> {
  await tx.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
    },
  });
}

/**
 * Fire-and-forget external notification (email/SMS). Intentionally not part
 * of the DB transaction - provider outages must never roll back financial
 * operations. Errors are swallowed and logged server-side only.
 */
export function notifyExternal(params: {
  email?: string;
  phone?: string;
  subject: string;
  message: string;
}): void {
  if (params.email) {
    sendEmail({ to: params.email, subject: params.subject, body: params.message }).catch((err) =>
      console.error('[notifyExternal] email failed', err)
    );
  }
  if (params.phone) {
    sendSms({ to: params.phone, message: params.message }).catch((err) =>
      console.error('[notifyExternal] sms failed', err)
    );
  }
}
