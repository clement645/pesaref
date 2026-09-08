'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { submitPaymentSchema } from '@/lib/validations/payment';
import { submitPayment, PaymentError } from '@/lib/services/payment.service';
import { getRequestContext } from '@/lib/request-context';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function submitPaymentAction(_prev: unknown, formData: FormData): Promise<ActionResult<{ paymentId: string }>> {
  const user = await requireUser();

  const parsed = submitPaymentSchema.safeParse({
    paymentReference: String(formData.get('paymentReference') ?? ''),
    paymentPhone: String(formData.get('paymentPhone') ?? ''),
    paymentDate: String(formData.get('paymentDate') ?? ''),
  });
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const { paymentId } = await submitPayment({ userId: user.id, ...parsed.data }, getRequestContext());
    revalidatePath('/dashboard');
    revalidatePath('/payment');
    return ok({ paymentId });
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.message);
    console.error('[submitPaymentAction]', err);
    return fail(GENERIC_ERROR);
  }
}
