'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';
import { recurringApi } from '@/services/apiService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import Loading from '@/components/Loading.jsx';
import { formatCurrency } from '@/utils/formatCurrency.js';
import styles from './RecurringListPage.module.css';

function intervalLabel(interval, t) {
  if (interval === 1) return t('recurring.intervals.monthly');
  if (interval === 6) return t('recurring.intervals.every6months');
  if (interval === 12) return t('recurring.intervals.every12months');
  return String(interval);
}

function RuleRow({ rule, onDeleted, onError, currency }) {
  const { t } = useTranslation();
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(t('recurring.confirmDelete'))) return;
    try {
      await recurringApi.remove(rule.id);
      onDeleted(rule.id);
    } catch (err) {
      onError?.(err.message);
    }
  }

  return (
    <tr>
      <td>
        <span className="badge" data-cat={rule.category}>
          {t(`categories.${rule.category}`)}
        </span>
      </td>
      <td className={styles.descCell}>{rule.description || '—'}</td>
      <td className="num">{formatCurrency(rule.amount, currency)}</td>
      <td>{intervalLabel(rule.interval, t)}</td>
      <td>
        <span className={rule.active ? styles.activeYes : styles.activeNo}>
          {rule.active ? t('recurring.status.active') : t('recurring.status.inactive')}
        </span>
      </td>
      <td className={styles.actionsCell}>
        <button
          className={styles.iconBtn}
          onClick={() => router.push(`/recurring/${rule.id}/edit`)}
          aria-label={t('common.edit')}
          type="button"
        >
          <Pencil size={15} />
        </button>
        <button
          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
          onClick={handleDelete}
          aria-label={t('common.delete')}
          type="button"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}

export default function RecurringListPage() {
  const { t } = useTranslation();
  const { currency } = useAuth();
  const router = useRouter();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recurringApi.list();
      setRules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchRules is async, setState only after await
    fetchRules();
  }, [fetchRules]);

  function handleDeleted(id) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="page">
      <div className={styles.header}>
        <h2 className="page-title">{t('recurring.heading')}</h2>
        <button className="btn-primary" onClick={() => router.push('/recurring/new')}>
          + {t('common.new')}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Loading />
      ) : rules.length === 0 ? (
        <div className={styles.emptyState}>
          <RefreshCw size={48} className={styles.emptyIcon} aria-hidden="true" />
          <p className={styles.emptyText}>{t('recurring.noRules')}</p>
        </div>
      ) : (
        <div className={`card ${styles.tableCard}`} style={{ padding: 0, overflow: 'hidden' }}>
          <div className={styles.tableScroll}>
            <table className={styles.rulesTable}>
              <thead>
                <tr>
                  <th scope="col">{t('recurring.fields.category')}</th>
                  <th scope="col">{t('recurring.fields.description')}</th>
                  <th scope="col" className="num">
                    {t('recurring.fields.amount')}
                  </th>
                  <th scope="col">{t('recurring.fields.interval')}</th>
                  <th scope="col">{t('recurring.fields.status')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('expenses.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onDeleted={handleDeleted}
                    onError={setError}
                    currency={currency}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
