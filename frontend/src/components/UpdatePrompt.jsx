import { useTranslation } from 'react-i18next';
import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt({ onUpdate }) {
  const { t } = useTranslation();
  return (
    <div className={styles.toast}>
      <span>{t('pwa.updateAvailable')}</span>
      <button className={styles.btn} onClick={onUpdate}>{t('pwa.reload')}</button>
    </div>
  );
}
