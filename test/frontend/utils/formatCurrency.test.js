import { describe, it, expect, vi } from 'vitest';

vi.mock('@/i18n/index.js', () => ({
  default: { language: 'en', t: (k) => k, changeLanguage: vi.fn() },
}));

import { formatCurrency } from '@/utils/formatCurrency.js';

describe('formatCurrency', () => {
  it('should format BRL value in en locale', () => {
    const result = formatCurrency(1234.5, 'BRL');
    expect(result).toContain('1,234.50');
  });

  it('should format USD value', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('99.99');
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toContain('0.00');
  });

  it('should format large numbers', () => {
    const result = formatCurrency(1000000, 'USD');
    expect(result).toContain('1,000,000.00');
  });

  it('should return empty string for null', () => {
    expect(formatCurrency(null, 'BRL')).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatCurrency(undefined, 'BRL')).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatCurrency(NaN, 'BRL')).toBe('');
  });

  it('should default to BRL when currency not provided', () => {
    const result = formatCurrency(100);
    expect(result).toBeTruthy();
    expect(result).toContain('100.00');
  });
});
