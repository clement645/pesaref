'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/session';
import { userStatusUpdateSchema, walletAdjustmentSchema, settingsUpdateSchema } from '@/lib/validations/admin';
import { updateUserStatus, adjustWallet, AdminActionError } from '@/lib/services/admin-user.service';
import { SETTING_KEYS } from '@/lib/services/settings.service';
import { writeAuditLog } from '@/lib/services/audit.service';
import { prisma } from '@/lib/db';
import { getRequestContext } from '@/lib/request-context';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function updateUserStatusAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();

  const parsed = userStatusUpdateSchema.safeParse({
    userId: String(formData.get('userId') ?? ''),
    status: String(formData.get('status') ?? ''),
    reason: String(formData.get('reason') ?? ''),
  });
  if (!parsed.success) return fail('Invalid request');

  try {
    await updateUserStatus({ ...parsed.data, adminId: admin.id }, getRequestContext());
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${parsed.data.userId}`);
    return ok(undefined);
  } catch (err) {
    if (err instanceof AdminActionError) return fail(err.message);
    console.error('[updateUserStatusAction]', err);
    return fail(GENERIC_ERROR);
  }
}

export async function adjustWalletAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  // Financial corrections are sensitive enough to require SUPER_ADMIN.
  const admin = await requireSuperAdmin();

  const parsed = walletAdjustmentSchema.safeParse({
    userId: String(formData.get('userId') ?? ''),
    amount: String(formData.get('amount') ?? ''),
    reason: String(formData.get('reason') ?? ''),
  });
  if (!parsed.success) {
    return fail('Enter a valid amount and reason', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    await adjustWallet({ ...parsed.data, adminId: admin.id }, getRequestContext());
    revalidatePath(`/admin/users/${parsed.data.userId}`);
    return ok(undefined);
  } catch (err) {
    if (err instanceof AdminActionError) return fail(err.message);
    console.error('[adjustWalletAction]', err);
    return fail(GENERIC_ERROR);
  }
}

export async function updateSettingsAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const admin = await requireSuperAdmin();

  const parsed = settingsUpdateSchema.safeParse({
    registrationFeeKes: String(formData.get('registrationFeeKes') ?? ''),
    referralCommissionKes: String(formData.get('referralCommissionKes') ?? ''),
    minWithdrawalKes: String(formData.get('minWithdrawalKes') ?? ''),
    platformName: String(formData.get('platformName') ?? ''),
    supportEmail: String(formData.get('supportEmail') ?? ''),
    supportPhone: String(formData.get('supportPhone') ?? ''),
    paymentInstructions: String(formData.get('paymentInstructions') ?? ''),
  });
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const ctx = getRequestContext();
    await prisma.$transaction(async (tx) => {
      const entries: Array<[string, string]> = [
        [SETTING_KEYS.REGISTRATION_FEE_KES, String(parsed.data.registrationFeeKes)],
        [SETTING_KEYS.REFERRAL_COMMISSION_KES, String(parsed.data.referralCommissionKes)],
        [SETTING_KEYS.MIN_WITHDRAWAL_KES, String(parsed.data.minWithdrawalKes)],
        [SETTING_KEYS.PLATFORM_NAME, parsed.data.platformName],
        [SETTING_KEYS.SUPPORT_EMAIL, parsed.data.supportEmail],
        [SETTING_KEYS.SUPPORT_PHONE, parsed.data.supportPhone],
        [SETTING_KEYS.PAYMENT_INSTRUCTIONS, parsed.data.paymentInstructions],
      ];
      for (const [key, value] of entries) {
        await tx.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
      }
      await writeAuditLog(tx, {
        actorId: admin.id,
        action: 'SETTINGS_UPDATED',
        entityType: 'SystemSetting',
        newValue: parsed.data,
        ...ctx,
      });
    });
    revalidatePath('/admin/settings');
    revalidatePath('/payment');
    return ok(undefined);
  } catch (err) {
    console.error('[updateSettingsAction]', err);
    return fail(GENERIC_ERROR);
  }
}
