export function formatCurrency(value, currency = 'BRL') {
  if (value == null || isNaN(value)) return '';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
