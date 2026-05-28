'use client';
import { useEffect } from 'react';
import i18n from '@/i18n/index.js';

// Module-level reset: synchronously sets i18n.language before React hydrates.
// useSyncExternalStore (used by useTranslation in react-i18next v14+) validates
// that the language snapshot matches between server ('pt-BR') and client renders.
// Without this, navigating away and back leaves i18n in a non-default language,
// causing a hydration mismatch. The user's saved preference is applied after
// mount in the useEffect below.
i18n.changeLanguage('pt-BR');

export default function I18nProvider({ children }) {
  useEffect(() => {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);
  return children;
}
