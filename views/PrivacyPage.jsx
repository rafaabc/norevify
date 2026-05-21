'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import styles from './LegalPage.module.css';

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const [content, setContent] = useState('');

  useEffect(() => {
    const lang = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en';
    import(`@/i18n/legal/${lang}/privacy.md`)
      .then(m => setContent(m.default))
      .catch(() => setContent(''));
  }, [i18n.language]);

  return (
    <div className={styles.container}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
