'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { markWithdrawalPaidSchema, rejectWithdrawalSchema } from '@/lib/validations/withdrawal';
import { markWithdrawalPaid, rejectWithdrawal, WithdrawalError } from '@/lib/services/withdrawal.service';
import { getRequestContext } from '@/lib/request-context';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function markWithdrawalPaidAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();

  const parsed = markWithdrawalPaidSchema.safeParse({
    withdrawalId: String(formData.get('withdrawalId') ?? ''),
    mpesaReference: String(formData.get('mpesaReference') ?? ''),
    adminNote: String(formData.get('adminNote') ?? ''),
  });
  if (!parsed.success) {
    return fail('Enter the M-Pesa transaction reference', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    await markWithdrawalPaid(
      {
        withdrawalId: parsed.data.withdrawalId,
        adminId: admin.id,
        mpesaReference: parsed.data.mpesaReference,
        adminNote: parsed.data.adminNote,
      },
      getRequestContext()
    );
    revalidatePath('/admin/withdrawals');
    revalidatePath(`/admin/withdrawals/${parsed.data.withdrawalId}`);
    revalidatePath('/admin');
    return ok(undefined);
  } catch (err) {
    if (err instanceof WithdrawalError) return fail(err.message);
    console.error('[markWithdrawalPaidAction]', err);
    return fail(GENERIC_ERROR);
  }
}

export async function rejectWithdrawalAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();

  const parsed = rejectWithdrawalSchema.safeParse({
    withdrawalId: String(formData.get('withdrawalId') ?? ''),
    rejectionReason: String(formData.get('rejectionReason') ?? ''),
    adminNote: String(formData.get('adminNote') ?? ''),
  });
  if (!parsed.success) {
    return fail('Select a rejection reason', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    await rejectWithdrawal(
      {
        withdrawalId: parsed.data.withdrawalId,
        adminId: admin.id,
        rejectionReason: parsed.data.rejectionReason,
        adminNote: parsed.data.adminNote,
      },
      getRequestContext()
    );
    revalidatePath('/admin/withdrawals');
    revalidatePath(`/admin/withdrawals/${parsed.data.withdrawalId}`);
    revalidatePath('/admin');
    return ok(undefined);
  } catch (err) {
    if (err instanceof WithdrawalError) return fail(err.message);
    console.error('[rejectWithdrawalAction]', err);
    return fail(GENERIC_ERROR);
  }
}
