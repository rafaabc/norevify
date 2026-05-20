import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/constants/currencies.js', () => ({
  DEFAULT_CURRENCY: 'BRL',
  SUPPORTED_CURRENCIES: ['BRL', 'USD'],
}));

vi.mock('@/constants/currencies', () => ({
  DEFAULT_CURRENCY: 'BRL',
  SUPPORTED_CURRENCIES: ['BRL', 'USD'],
}));

import { detectCurrency } from '@/utils/detectCurrency.js';

describe('detectCurrency', () => {
  const originalNavigator = global.navigator;

  function setLanguage(lang) {
    Object.defineProperty(global, 'navigator', {
      value: { language: lang },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it.each([
    ['pt-BR', 'BRL'],
    ['en-US', 'USD'],
    ['de',    'EUR'],
    ['fr-FR', 'EUR'],
    ['en-GB', 'GBP'],
    ['ja-JP', 'JPY'],
    ['sv',    'SEK'],
    ['en-CA', 'CAD'],
    ['xx-XX', 'BRL'],
  ])('should return %s for %s locale', (lang, expected) => {
    setLanguage(lang);
    expect(detectCurrency()).toBe(expected);
  });

  it('should return DEFAULT_CURRENCY when navigator is undefined', () => {
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(detectCurrency()).toBe('BRL');
  });
});
