import i18n from '../../src/i18n/index.js';

describe('i18n initialization', () => {
  test('should initialize with pt-BR as default language', async () => {
    // i18next init is called at module load; wait for it
    await i18n.init; // no-op if already initialized
    expect(i18n.language === 'pt-BR' || i18n.options.fallbackLng.includes('pt-BR')).toBe(true);
  });

  test('should have common namespace loaded for pt-BR', () => {
    const bundle = i18n.getResourceBundle('pt-BR', 'common');
    expect(bundle).toBeTruthy();
    expect(bundle.common.save).toBe('Salvar');
  });

  test('should have common namespace loaded for en', () => {
    const bundle = i18n.getResourceBundle('en', 'common');
    expect(bundle).toBeTruthy();
    expect(bundle.common.save).toBe('Save');
  });

  test('should translate known key in pt-BR', () => {
    i18n.changeLanguage('pt-BR');
    expect(i18n.t('common.save')).toBe('Salvar');
  });

  test('should translate known key in en', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('common.save')).toBe('Save');
  });

  test('should fall back to key for unknown key', () => {
    i18n.changeLanguage('pt-BR');
    expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
  });
});
