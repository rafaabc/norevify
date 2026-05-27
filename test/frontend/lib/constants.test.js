import { describe, it, expect } from 'vitest';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/constants/currencies.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/constants/languages.js';
import { POLICY_VERSION } from '@/lib/constants/legal.js';

describe('currencies constants', () => {
  it('should export BRL as default currency', () => {
    expect(DEFAULT_CURRENCY).toBe('BRL');
  });

  it('should list supported currencies', () => {
    expect(SUPPORTED_CURRENCIES).toContain('BRL');
    expect(SUPPORTED_CURRENCIES).toContain('USD');
    expect(SUPPORTED_CURRENCIES).toContain('EUR');
    expect(SUPPORTED_CURRENCIES.length).toBeGreaterThan(0);
  });
});

describe('languages constants', () => {
  it('should export pt-BR as default language', () => {
    expect(DEFAULT_LANGUAGE).toBe('pt-BR');
  });

  it('should list pt-BR and en as supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toContain('pt-BR');
    expect(SUPPORTED_LANGUAGES).toContain('en');
  });
});

describe('legal constants', () => {
  it('should export POLICY_VERSION as a date string', () => {
    expect(typeof POLICY_VERSION).toBe('string');
    expect(POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
