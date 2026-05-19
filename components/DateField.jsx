'use client';
import { useTranslation } from 'react-i18next';
import { todayISO } from '@/utils/formatDate.js';

export default function DateField({ value, onChange, name = 'date', id }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en-US' : i18n.language;
  return (
    <input
      type="date"
      lang={lang}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      max={todayISO()}
      required
    />
  );
}
