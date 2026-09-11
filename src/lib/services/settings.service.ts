import 'server-only';
import { prisma } from '@/lib/db';

export const SETTING_KEYS = {
  REGISTRATION_FEE_KES: 'registrationFeeKes',
  REFERRAL_COMMISSION_KES: 'referralCommissionKes',
  MIN_WITHDRAWAL_KES: 'minWithdrawalKes',
  PLATFORM_NAME: 'platformName',
  SUPPORT_EMAIL: 'supportEmail',
  SUPPORT_PHONE: 'supportPhone',
  PAYMENT_INSTRUCTIONS: 'paymentInstructions',
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.REGISTRATION_FEE_KES]: process.env.REGISTRATION_FEE_KES ?? '200',
  [SETTING_KEYS.REFERRAL_COMMISSION_KES]: process.env.REFERRAL_COMMISSION_KES ?? '100',
  [SETTING_KEYS.MIN_WITHDRAWAL_KES]: process.env.MIN_WITHDRAWAL_KES ?? '100',
  [SETTING_KEYS.PLATFORM_NAME]: 'PesaRef',
  [SETTING_KEYS.SUPPORT_EMAIL]: 'support@example.com',
  [SETTING_KEYS.SUPPORT_PHONE]: '+254700000000',
  [SETTING_KEYS.PAYMENT_INSTRUCTIONS]:
    'Send KSh 200 via M-Pesa to Till Number 6614582 (ABRAHAM). Use your full name as the account reference, then submit the transaction reference below.',
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? '';
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function getNumericSetting(key: string): Promise<number> {
  const value = await getSetting(key);
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.parseInt(DEFAULTS[key] ?? '0', 10);
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getRegistrationFee(): Promise<number> {
  return getNumericSetting(SETTING_KEYS.REGISTRATION_FEE_KES);
}

export async function getReferralCommission(): Promise<number> {
  return getNumericSetting(SETTING_KEYS.REFERRAL_COMMISSION_KES);
}

export async function getMinWithdrawal(): Promise<number> {
  return getNumericSetting(SETTING_KEYS.MIN_WITHDRAWAL_KES);
}
