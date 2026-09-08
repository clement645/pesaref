import { Badge } from '@/components/ui/badge';

const PAYMENT_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  PENDING: { label: 'Payment Pending', variant: 'warning' },
  APPROVED: { label: 'Payment Approved', variant: 'success' },
  REJECTED: { label: 'Payment Rejected', variant: 'destructive' },
  CANCELLED: { label: 'Payment Cancelled', variant: 'secondary' },
};

const WITHDRAWAL_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  PENDING: { label: 'Withdrawal Pending', variant: 'warning' },
  PAID: { label: 'Withdrawal Paid', variant: 'success' },
  REJECTED: { label: 'Withdrawal Rejected', variant: 'destructive' },
  CANCELLED: { label: 'Withdrawal Cancelled', variant: 'secondary' },
};

const REFERRAL_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  REGISTERED: { label: 'Registered', variant: 'secondary' },
  PAYMENT_PENDING: { label: 'Payment Pending', variant: 'warning' },
  QUALIFIED: { label: 'Qualified', variant: 'warning' },
  COMMISSIONED: { label: 'Commission Earned', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const USER_STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', variant: 'warning' },
  ACTIVE: { label: 'Active', variant: 'success' },
  SUSPENDED: { label: 'Suspended', variant: 'destructive' },
  DEACTIVATED: { label: 'Deactivated', variant: 'secondary' },
};

function StatusBadge({
  map,
  status,
}: {
  map: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }>;
  status: string;
}) {
  const entry = map[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export const PaymentStatusBadge = ({ status }: { status: string }) => <StatusBadge map={PAYMENT_LABELS} status={status} />;
export const WithdrawalStatusBadge = ({ status }: { status: string }) => <StatusBadge map={WITHDRAWAL_LABELS} status={status} />;
export const ReferralStatusBadge = ({ status }: { status: string }) => <StatusBadge map={REFERRAL_LABELS} status={status} />;
export const UserStatusBadge = ({ status }: { status: string }) => <StatusBadge map={USER_STATUS_LABELS} status={status} />;
