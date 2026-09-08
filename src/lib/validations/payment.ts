import { z } from 'zod';
import { isValidKenyanPhone } from '@/lib/utils/phone';

export const submitPaymentSchema = z.object({
  paymentReference: z
    .string()
    .trim()
    .min(3, 'Enter the M-Pesa transaction reference')
    .max(50),
  paymentPhone: z
    .string()
    .trim()
    .refine(isValidKenyanPhone, 'Enter a valid Kenyan phone number'),
  paymentDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date')
    // A plain YYYY-MM-DD value parses as UTC midnight, which can appear to be
    // "in the future" for a Kenyan (UTC+3) user early in their local day -
    // a one-day buffer keeps the check meaningful (rejects clearly future
    // dates) without misfiring on today's date across timezones.
    .refine((v) => new Date(v).getTime() <= Date.now() + 24 * 60 * 60 * 1000, 'Payment date cannot be in the future'),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;

export const rejectPaymentSchema = z.object({
  paymentId: z.string().min(1),
  rejectionReason: z.string().trim().min(3, 'Provide a rejection reason').max(300),
});

export const approvePaymentSchema = z.object({
  paymentId: z.string().min(1),
  adminNote: z.string().trim().max(300).optional().or(z.literal('')),
});
