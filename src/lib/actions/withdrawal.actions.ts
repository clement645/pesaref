'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { requestWithdrawalSchema } from '@/lib/validations/withdrawal';
import { requestWithdrawal, WithdrawalError } from '@/lib/services/withdrawal.service';
import { getRequestContext } from '@/lib/request-context';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function requestWithdrawalAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult<{ withdrawalId: string }>> {
  const user = await requireUser();

  const parsed = requestWithdrawalSchema.safeParse({
    amount: String(formData.get('amount') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    note: String(formData.get('note') ?? ''),
  });
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const { withdrawalId } = await requestWithdrawal(
      { userId: user.id, amount: parsed.data.amount, phone: parsed.data.phone, note: parsed.data.note },
      getRequestContext()
    );
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/withdrawals');
    revalidatePath('/dashboard/wallet');
    return ok({ withdrawalId });
  } catch (err) {
    if (err instanceof WithdrawalError) return fail(err.message);
    console.error('[requestWithdrawalAction]', err);
    return fail(GENERIC_ERROR);
  }
}
