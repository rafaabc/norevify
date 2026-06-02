'use client';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { expensesApi } from '@/services/apiService.js';
import { formatDate } from '@/utils/formatDate.js';
import { formatCurrency } from '@/utils/formatCurrency.js';
import { categoryLabel } from '@/utils/categories.js';
import styles from './ExpenseRow.module.css';

export default function ExpenseRow({ expense, onDeleted, onError, currency = 'BRL' }) {
  const { t } = useTranslation();
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(t('expenses.confirmDelete'))) return;
    try {
      await expensesApi.remove(expense.id);
      onDeleted(expense.id);
    } catch (err) {
      onError?.(err.message);
    }
  }

  const dateLabel = formatDate(expense.date);

  return (
    <tr>
      <td className={styles.dateCell}>{dateLabel}</td>
      <td>
        <span className="badge" data-cat={expense.category}>
          {categoryLabel(expense.category, t)}
        </span>
      </td>
      <td className={`num ${styles.amountCell}`}>{formatCurrency(expense.amount, currency)}</td>
      <td>
        <div className="actions">
          <button
            className={styles.iconBtn}
            onClick={() => router.push(`/expenses/${expense.id}/edit`)}
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Pencil size={15} />
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={handleDelete}
            title={t('common.delete')}
            aria-label={t('common.delete')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
