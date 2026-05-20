import { describe, it, expect } from 'vitest';
import i18n from '@/i18n/index.js';

describe('i18n init', () => {
  it('should be initialized with pt-BR as default language', () => {
    expect(i18n.language).toBe('pt-BR');
  });

  it('should support pt-BR and en languages', () => {
    const supported = i18n.options.supportedLngs;
    expect(supported).toContain('pt-BR');
    expect(supported).toContain('en');
  });

  it('should have pt-BR as fallback language', () => {
    const fallback = i18n.options.fallbackLng;
    const normalized = Array.isArray(fallback) ? fallback[0] : fallback;
    expect(normalized).toBe('pt-BR');
  });

  it('should have common namespace as default', () => {
    expect(i18n.options.defaultNS).toBe('common');
  });

  it('should have en translations loaded', () => {
    expect(i18n.hasResourceBundle('en', 'common')).toBe(true);
  });

  it('should have pt-BR translations loaded', () => {
    expect(i18n.hasResourceBundle('pt-BR', 'common')).toBe(true);
  });

  it('should translate a known key in pt-BR', () => {
    expect(i18n.t('nav.dashboard')).toBeTruthy();
  });
});
