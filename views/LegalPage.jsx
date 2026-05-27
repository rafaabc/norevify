'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LegalPage.module.css';

export default function LegalPage({ doc }) {
  const { i18n } = useTranslation();
  const [content, setContent] = useState('');

  useEffect(() => {
    const lang = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en';
    fetch(`/legal/${lang}/${doc}.md`)
      .then(r => r.ok ? r.text() : '')
      .then(setContent)
      .catch(() => setContent(''));
  }, [i18n.language, doc]);

  return (
    <div className={styles.container}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
