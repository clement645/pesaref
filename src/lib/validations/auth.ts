import { z } from 'zod';
import { isValidKenyanPhone } from '@/lib/utils/phone';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/\d/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .refine(isValidKenyanPhone, 'Enter a valid Kenyan phone number (e.g. 0712345678)'),
    password: passwordSchema,
    confirmPassword: z.string(),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .max(20)
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().refine(isValidKenyanPhone, 'Enter a valid Kenyan phone number'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
