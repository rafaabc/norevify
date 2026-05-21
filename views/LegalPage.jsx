'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import styles from './LegalPage.module.css';

const loaders = {
  privacy: {
    'pt-BR': () => import('@/i18n/legal/pt-BR/privacy.md'),
    en:      () => import('@/i18n/legal/en/privacy.md'),
  },
  terms: {
    'pt-BR': () => import('@/i18n/legal/pt-BR/terms.md'),
    en:      () => import('@/i18n/legal/en/terms.md'),
  },
};

export default function LegalPage({ doc }) {
  const { i18n } = useTranslation();
  const [content, setContent] = useState('');

  useEffect(() => {
    const lang = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en';
    loaders[doc]?.[lang]?.()
      .then(m => setContent(m.default))
      .catch(() => setContent(''));
  }, [i18n.language, doc]);

  return (
    <div className={styles.container}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
