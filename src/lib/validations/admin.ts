import { z } from 'zod';

export const userStatusUpdateSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'PENDING_PAYMENT']),
  reason: z.string().trim().max(300).optional().or(z.literal('')),
});

export const walletAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int('Amount must be a whole number').refine((v) => v !== 0, 'Amount cannot be zero'),
  reason: z.string().trim().min(3, 'A reason is required for financial adjustments').max(300),
});

export const settingsUpdateSchema = z.object({
  registrationFeeKes: z.coerce.number().int().positive(),
  referralCommissionKes: z.coerce.number().int().positive(),
  minWithdrawalKes: z.coerce.number().int().positive(),
  platformName: z.string().trim().min(2).max(80),
  supportEmail: z.string().trim().email(),
  supportPhone: z.string().trim().min(6).max(20),
  paymentInstructions: z.string().trim().min(10).max(2000),
});
