// Global Jest manual mock for react-i18next.
// Tests that need specific translation output should override with jest.mock().
const useMock = (k) => k;
useMock.language = 'pt-BR';

module.exports = {
  useTranslation: () => ({ t: useMock, i18n: { language: 'pt-BR', changeLanguage: jest.fn() } }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
};
