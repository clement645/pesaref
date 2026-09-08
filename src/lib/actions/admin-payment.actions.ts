'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { approvePaymentSchema, rejectPaymentSchema } from '@/lib/validations/payment';
import { approvePayment, rejectPayment, PaymentError } from '@/lib/services/payment.service';
import { getRequestContext } from '@/lib/request-context';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function approvePaymentAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();

  const parsed = approvePaymentSchema.safeParse({
    paymentId: String(formData.get('paymentId') ?? ''),
    adminNote: String(formData.get('adminNote') ?? ''),
  });
  if (!parsed.success) return fail('Invalid request');

  try {
    await approvePayment({ paymentId: parsed.data.paymentId, adminId: admin.id, adminNote: parsed.data.adminNote }, getRequestContext());
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/payments/${parsed.data.paymentId}`);
    revalidatePath('/admin');
    return ok(undefined);
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.message);
    console.error('[approvePaymentAction]', err);
    return fail(GENERIC_ERROR);
  }
}

export async function rejectPaymentAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const admin = await requireAdmin();

  const parsed = rejectPaymentSchema.safeParse({
    paymentId: String(formData.get('paymentId') ?? ''),
    rejectionReason: String(formData.get('rejectionReason') ?? ''),
  });
  if (!parsed.success) {
    return fail('A rejection reason is required', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    await rejectPayment(
      { paymentId: parsed.data.paymentId, adminId: admin.id, rejectionReason: parsed.data.rejectionReason },
      getRequestContext()
    );
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/payments/${parsed.data.paymentId}`);
    revalidatePath('/admin');
    return ok(undefined);
  } catch (err) {
    if (err instanceof PaymentError) return fail(err.message);
    console.error('[rejectPaymentAction]', err);
    return fail(GENERIC_ERROR);
  }
}
