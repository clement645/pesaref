/**
 * Normalizes Kenyan phone numbers to a consistent E.164-ish canonical form:
 * 2547XXXXXXXX or 2541XXXXXXXX (12 digits, no leading +).
 *
 * Accepts input like:
 *   0712345678, 712345678, +254712345678, 254712345678, 0112345678
 */
const KENYA_MOBILE_REGEX = /^254(7\d{8}|1\d{8})$/;

export function normalizeKenyanPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.trim().replace(/[\s\-()]/g, '');
  digits = digits.replace(/^\+/, '');

  if (digits.startsWith('0') && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  } else if (digits.length === 9 && /^[71]/.test(digits)) {
    digits = `254${digits}`;
  }

  if (!KENYA_MOBILE_REGEX.test(digits)) return null;
  return digits;
}

export function isValidKenyanPhone(input: string): boolean {
  return normalizeKenyanPhone(input) !== null;
}

export function formatPhoneForDisplay(canonical: string): string {
  if (!/^254\d{9}$/.test(canonical)) return canonical;
  return `+${canonical}`;
}
