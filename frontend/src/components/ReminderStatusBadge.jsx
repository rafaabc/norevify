import { useTranslation } from 'react-i18next';
import styles from './ReminderStatusBadge.module.css';

export default function ReminderStatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span
      className={`${styles.badge} ${styles[status] || ''}`}
      data-testid="reminder-status-badge"
      data-status={status}
    >
      {t(`reminders.status.${status}`)}
    </span>
  );
}
