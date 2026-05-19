'use client';
import { useEffect } from 'react';
import '@/i18n/index.js';

export default function I18nProvider({ children }) {
  useEffect(() => {
    // i18n initializes via side effect import above
  }, []);
  return children;
}
