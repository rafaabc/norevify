import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import ptBR from './locales/pt-BR/common.json';

i18n.use(initReactI18next).init({
  lng: 'pt-BR',
  resources: {
    en: { common: en },
    'pt-BR': { common: ptBR },
  },
  fallbackLng: 'pt-BR',
  supportedLngs: ['pt-BR', 'en'],
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
