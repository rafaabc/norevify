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

  it('should return BRL for pt-BR locale', () => {
    setLanguage('pt-BR');
    expect(detectCurrency()).toBe('BRL');
  });

  it('should return USD for en-US locale', () => {
    setLanguage('en-US');
    expect(detectCurrency()).toBe('USD');
  });

  it('should return EUR for de locale (base match)', () => {
    setLanguage('de');
    expect(detectCurrency()).toBe('EUR');
  });

  it('should return EUR for fr-FR locale', () => {
    setLanguage('fr-FR');
    expect(detectCurrency()).toBe('EUR');
  });

  it('should return GBP for en-GB locale', () => {
    setLanguage('en-GB');
    expect(detectCurrency()).toBe('GBP');
  });

  it('should return JPY for ja-JP locale', () => {
    setLanguage('ja-JP');
    expect(detectCurrency()).toBe('JPY');
  });

  it('should return SEK for sv locale (base match)', () => {
    setLanguage('sv');
    expect(detectCurrency()).toBe('SEK');
  });

  it('should return CAD for en-CA locale', () => {
    setLanguage('en-CA');
    expect(detectCurrency()).toBe('CAD');
  });

  it('should return DEFAULT_CURRENCY for unknown locale', () => {
    setLanguage('xx-XX');
    expect(detectCurrency()).toBe('BRL');
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
