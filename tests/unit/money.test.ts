import { describe, it, expect } from 'vitest';
import { formatKES, isValidWholeAmount, parseAmountInput } from '@/lib/utils/money';

describe('formatKES', () => {
  it('formats whole shilling amounts with thousands separators', () => {
    expect(formatKES(2500)).toBe('KSh 2,500');
    expect(formatKES(0)).toBe('KSh 0');
    expect(formatKES(1000000)).toBe('KSh 1,000,000');
  });
});

describe('isValidWholeAmount', () => {
  it('accepts positive integers only', () => {
    expect(isValidWholeAmount(250)).toBe(true);
    expect(isValidWholeAmount(0)).toBe(false);
    expect(isValidWholeAmount(-10)).toBe(false);
    expect(isValidWholeAmount(10.5)).toBe(false);
    expect(isValidWholeAmount('250')).toBe(false);
  });
});

describe('parseAmountInput', () => {
  it('parses comma-formatted whole number strings', () => {
    expect(parseAmountInput('2,500')).toBe(2500);
    expect(parseAmountInput('250')).toBe(250);
  });

  it('rejects invalid or non-integer input', () => {
    expect(parseAmountInput('250.50')).toBeNull();
    expect(parseAmountInput('-250')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('0')).toBeNull();
  });
});
