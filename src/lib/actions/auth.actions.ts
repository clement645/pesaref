'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';
import { registerUser, RegistrationError } from '@/lib/services/user.service';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { checkRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit';
import { createPasswordResetToken, resetPasswordWithToken } from '@/lib/services/password-reset.service';
import { getRequestContext } from '@/lib/request-context';
import { sendEmail } from '@/lib/email';
import { ok, fail, GENERIC_ERROR, type ActionResult } from './action-result';

export async function registerAction(_prev: unknown, formData: FormData): Promise<ActionResult<{ userId: string }>> {
  const raw = {
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
    referralCode: String(formData.get('referralCode') ?? ''),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const ctx = getRequestContext();
  const rateLimit = await checkRateLimit(`register:${ctx.ipAddress ?? 'unknown'}`);
  if (!rateLimit.allowed) {
    return fail('Too many attempts. Please try again later.');
  }

  try {
    const { userId } = await registerUser(
      {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
        referralCode: parsed.data.referralCode || undefined,
      },
      ctx
    );
    await recordLoginAttempt({ identifier: `register:${ctx.ipAddress ?? 'unknown'}`, success: true, userId });
    return ok({ userId });
  } catch (err) {
    await recordLoginAttempt({ identifier: `register:${ctx.ipAddress ?? 'unknown'}`, success: false });
    if (err instanceof RegistrationError) {
      return fail(err.message, { [err.field]: [err.message] });
    }
    console.error('[registerAction]', err);
    return fail(GENERIC_ERROR);
  }
}

export async function loginAction(_prev: unknown, formData: FormData): Promise<ActionResult<{ role: string }>> {
  const raw = { email: String(formData.get('email') ?? ''), password: String(formData.get('password') ?? '') };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return fail('Enter a valid email and password', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const ctx = getRequestContext();
  const identifier = `login:${parsed.data.email}`;
  const rateLimit = await checkRateLimit(identifier);
  if (!rateLimit.allowed) {
    return fail('Too many failed login attempts. Please try again in 15 minutes.');
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user || user.status === 'DEACTIVATED') {
    await recordLoginAttempt({ identifier, success: false, ipAddress: ctx.ipAddress });
    return fail('Invalid email or password');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return fail('This account is temporarily locked due to repeated failed logins. Try again later.');
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    await recordLoginAttempt({ identifier, success: false, userId: user.id, ipAddress: ctx.ipAddress });
    const failedCount = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failedCount,
        lockedUntil: failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
      },
    });
    return fail('Invalid email or password');
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  await recordLoginAttempt({ identifier, success: true, userId: user.id, ipAddress: ctx.ipAddress });
  await createSession(user.id, user.role);

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'ADMIN_LOGIN', entityType: 'User', entityId: user.id, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent },
    });
  }

  return ok({ role: user.role });
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}

export async function forgotPasswordAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const parsed = forgotPasswordSchema.safeParse({ email: String(formData.get('email') ?? '') });
  if (!parsed.success) return fail('Enter a valid email address');

  const ctx = getRequestContext();
  const rateLimit = await checkRateLimit(`forgot:${ctx.ipAddress ?? 'unknown'}`);
  if (!rateLimit.allowed) return fail('Too many requests. Please try again later.');
  await recordLoginAttempt({ identifier: `forgot:${ctx.ipAddress ?? 'unknown'}`, success: true });

  const token = await createPasswordResetToken(parsed.data.email);
  if (token) {
    const resetUrl = `${process.env.APP_URL ?? ''}/reset-password?token=${token}`;
    await sendEmail({
      to: parsed.data.email,
      subject: 'Reset your PesaRef password',
      body: `Click the link to reset your password (valid for 1 hour): ${resetUrl}`,
    }).catch((err) => console.error('[forgotPasswordAction] email failed', err));
  }

  // Always return success to avoid revealing whether the email exists.
  return ok(undefined);
}

export async function resetPasswordAction(_prev: unknown, formData: FormData): Promise<ActionResult<undefined>> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get('token') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
  if (!parsed.success) {
    return fail('Please fix the errors below', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password, getRequestContext());
  if (!result.success) return fail(result.error);
  return ok(undefined);
}
