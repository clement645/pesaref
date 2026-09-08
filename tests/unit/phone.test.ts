import { describe, it, expect } from 'vitest';
import { normalizeKenyanPhone, isValidKenyanPhone, formatPhoneForDisplay } from '@/lib/utils/phone';

describe('normalizeKenyanPhone', () => {
  it('normalizes common Kenyan phone formats to a single canonical form', () => {
    expect(normalizeKenyanPhone('0712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('+254712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('254712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('0112345678')).toBe('254112345678');
  });

  it('handles whitespace and separators', () => {
    expect(normalizeKenyanPhone('0712 345 678')).toBe('254712345678');
    expect(normalizeKenyanPhone(' +254-712-345-678 ')).toBe('254712345678');
  });

  it('rejects invalid numbers', () => {
    expect(normalizeKenyanPhone('12345')).toBeNull();
    expect(normalizeKenyanPhone('0212345678')).toBeNull();
    expect(normalizeKenyanPhone('')).toBeNull();
    expect(normalizeKenyanPhone('254812345678')).toBeNull();
  });
});

describe('isValidKenyanPhone', () => {
  it('mirrors normalizeKenyanPhone validity', () => {
    expect(isValidKenyanPhone('0712345678')).toBe(true);
    expect(isValidKenyanPhone('notaphone')).toBe(false);
  });
});

describe('formatPhoneForDisplay', () => {
  it('adds a leading plus to canonical numbers', () => {
    expect(formatPhoneForDisplay('254712345678')).toBe('+254712345678');
  });
});
