/**
 * All money in PesaRef is stored and calculated as whole Kenyan Shillings
 * (integers). Never introduce floating-point arithmetic for money - always
 * use these helpers so amounts stay integers end-to-end.
 */

export function formatKES(amount: number): string {
  const rounded = Math.round(amount);
  return `KSh ${rounded.toLocaleString('en-KE')}`;
}

export function isValidWholeAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}
