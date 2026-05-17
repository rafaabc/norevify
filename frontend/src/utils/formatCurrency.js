import i18n from '../i18n/index.js';

export function formatCurrency(value, currency = 'BRL') {
  if (value == null || isNaN(value)) return '';
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
