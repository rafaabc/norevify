import { DEFAULT_CURRENCY } from '@/constants/currencies';

const LOCALE_TO_CURRENCY = {
  'pt-BR': 'BRL',
  'da':    'DKK',
  'da-DK': 'DKK',
  'en-US': 'USD',
  'de':    'EUR',
  'de-DE': 'EUR',
  'fr':    'EUR',
  'fr-FR': 'EUR',
  'en-GB': 'GBP',
  'ja':    'JPY',
  'ja-JP': 'JPY',
  'de-CH': 'CHF',
  'fr-CH': 'CHF',
  'sv':    'SEK',
  'sv-SE': 'SEK',
  'nb':    'NOK',
  'nb-NO': 'NOK',
  'en-CA': 'CAD',
  'fr-CA': 'CAD',
};

export function detectCurrency() {
  const lang = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  return LOCALE_TO_CURRENCY[lang] || LOCALE_TO_CURRENCY[lang.split('-')[0]] || DEFAULT_CURRENCY;
}
