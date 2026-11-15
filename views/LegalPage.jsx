'use client';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LegalPage.module.css';

export default function LegalPage({ content }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en';

  return (
    <main className={styles.container}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content?.[lang] ?? ''}</ReactMarkdown>
    </main>
  );
}
