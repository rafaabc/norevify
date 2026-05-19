import i18n from '../i18n/index.js';

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const lang = i18n?.language;
  const locale = !lang || lang === 'en' ? 'en-US' : lang;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function currentYear() {
  return new Date().getFullYear();
}
