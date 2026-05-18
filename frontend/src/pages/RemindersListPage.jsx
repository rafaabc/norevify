import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { remindersApi } from '../services/apiService.js';
import ReminderStatusBadge from '../components/ReminderStatusBadge.jsx';
import CompleteReminderDialog from '../components/CompleteReminderDialog.jsx';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import styles from './RemindersListPage.module.css';

export default function RemindersListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const status = tab === 'active' ? 'active' : 'done';
      setItems(await remindersApi.list({ status }));
    } catch (e) { setError(e.message); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function handleComplete(km) {
    try {
      await remindersApi.complete(completing.id, { completedKm: km });
      setCompleting(null);
      load();
      window.dispatchEvent(new CustomEvent('reminders:changed'));
    } catch (e) { setError(e.message); }
  }

  async function handleDelete() {
    try {
      await remindersApi.remove(deleting.id);
      setDeleting(null);
      load();
      window.dispatchEvent(new CustomEvent('reminders:changed'));
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="page">
      <div className={styles.header}>
        <h1>{t('reminders.heading')}</h1>
        <Link to="/reminders/new" className="btn-primary">{t('reminders.newReminder')}</Link>
      </div>

      <div className={styles.tabs}>
        <button type="button"
          className={tab === 'active' ? styles.tabActive : styles.tab}
          onClick={() => setTab('active')}>
          {t('reminders.tabs.active')}
        </button>
        <button type="button"
          className={tab === 'history' ? styles.tabActive : styles.tab}
          onClick={() => setTab('history')}>
          {t('reminders.tabs.history')}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {items.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{t('reminders.noReminders')}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((r) => (
            <li key={r.id} className={styles.row}>
              <div className={styles.info}>
                <strong>{t(`reminderTypes.${r.type}`)}</strong>
                {r.title && <span className={styles.subtitle}> — {r.title}</span>}
                <div className={styles.meta}>
                  {r.dueDate && <span>{new Date(r.dueDate).toLocaleDateString(i18n.language)}</span>}
                  {r.dueKm != null && <span> · {r.dueKm} km</span>}
                </div>
              </div>
              <ReminderStatusBadge status={r.status} />
              <div className={styles.actions}>
                {tab === 'active' && (
                  <>
                    <button type="button" className="btn-secondary"
                            onClick={() => navigate(`/reminders/${r.id}/edit`)}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="btn-primary"
                            onClick={() => setCompleting(r)}>
                      {t('reminders.actions.complete')}
                    </button>
                  </>
                )}
                <button type="button" className="btn-danger"
                        onClick={() => setDeleting(r)}>
                  {t('common.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CompleteReminderDialog
        open={!!completing}
        reminder={completing}
        onSubmit={handleComplete}
        onCancel={() => setCompleting(null)}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        requireDouble={deleting?.status === 'done'}
        message={t('reminders.actions.confirmDelete')}
        messages={[
          t('reminders.actions.confirmDeleteHistory'),
          t('reminders.actions.confirmDeleteHistory2'),
        ]}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
