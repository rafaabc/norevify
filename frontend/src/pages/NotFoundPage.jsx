import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <Compass size={64} className={styles.icon} aria-hidden="true" />
      <p className={styles.code}>404</p>
      <p className={styles.message}>{t('notFound.heading')}</p>
      <button className="btn-primary" onClick={() => navigate('/')}>{t('notFound.back')}</button>
    </div>
  );
}
