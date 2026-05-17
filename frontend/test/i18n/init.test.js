import i18n from '../../src/i18n/index.js';

describe('i18n initialization', () => {
  test('should initialize with pt-BR as fallback language', () => {
    const fallback = i18n.options.fallbackLng;
    const fallbacks = Array.isArray(fallback) ? fallback : [fallback];
    expect(fallbacks).toContain('pt-BR');
  });

  test('should have common namespace loaded for pt-BR', () => {
    expect(i18n.hasResourceBundle('pt-BR', 'common')).toBe(true);
  });

  test('should have common namespace loaded for en', () => {
    expect(i18n.hasResourceBundle('en', 'common')).toBe(true);
  });

  test('should translate known key in pt-BR', async () => {
    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('common.save')).toBe('Salvar');
  });

  test('should translate known key in en', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common.save')).toBe('Save');
  });

  test('should fall back to key for unknown key', async () => {
    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
  });
});
