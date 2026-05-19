'use client';
import { useEffect } from 'react';
import i18n from '@/i18n/index.js';

export default function I18nProvider({ children }) {
  useEffect(() => {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);
  return children;
}
