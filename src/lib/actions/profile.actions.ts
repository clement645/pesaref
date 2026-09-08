'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations/auth';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { normalizeKenyanPhone } from '@/lib/utils/phone';
import { writeAuditLog } from '@/lib/services/audit.service';
import { getRequestContext } from '@/lib/request-context';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function updateProfileAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse({
    fullName: String(formData.get('fullName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  });
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const normalizedPhone = normalizeKenyanPhone(parsed.data.phone)!;
  const existingPhone = await prisma.user.findFirst({
    where: { phone: normalizedPhone, NOT: { id: user.id } },
  });
  if (existingPhone) {
    return fail('This phone number is already in use', { phone: ['This phone number is already in use'] });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { fullName: parsed.data.fullName, phone: normalizedPhone },
    });
    revalidatePath('/dashboard/profile');
    return ok(undefined);
  } catch (err) {
    console.error('[updateProfileAction]', err);
    return fail(GENERIC_ERROR);
  }
}

export async function changePasswordAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get('currentPassword') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const validCurrent = await verifyPassword(parsed.data.currentPassword, fullUser.passwordHash);
  if (!validCurrent) {
    return fail('Current password is incorrect', { currentPassword: ['Current password is incorrect'] });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await writeAuditLog(prisma, {
    actorId: user.id,
    action: 'PASSWORD_CHANGED',
    entityType: 'User',
    entityId: user.id,
    ...getRequestContext(),
  });

  return ok(undefined);
}
