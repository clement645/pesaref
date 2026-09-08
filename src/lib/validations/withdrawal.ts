import { z } from 'zod';
import { isValidKenyanPhone } from '@/lib/utils/phone';

export const requestWithdrawalSchema = z.object({
  amount: z.coerce.number().int('Amount must be a whole number').positive('Amount must be greater than zero'),
  phone: z.string().trim().refine(isValidKenyanPhone, 'Enter a valid Kenyan phone number'),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

export type RequestWithdrawalInput = z.infer<typeof requestWithdrawalSchema>;

export const REJECTION_REASONS = [
  'Invalid payment details',
  'Account verification issue',
  'Duplicate request',
  'Other',
] as const;

export const rejectWithdrawalSchema = z.object({
  withdrawalId: z.string().min(1),
  rejectionReason: z.enum(REJECTION_REASONS),
  adminNote: z.string().trim().max(300).optional().or(z.literal('')),
});

export const markWithdrawalPaidSchema = z.object({
  withdrawalId: z.string().min(1),
  mpesaReference: z.string().trim().min(3, 'Enter the M-Pesa transaction reference').max(50),
  adminNote: z.string().trim().max(300).optional().or(z.literal('')),
});
