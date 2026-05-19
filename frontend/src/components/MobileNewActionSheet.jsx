import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MobileNewActionSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!open) return null;

  function go(path) {
    onClose();
    navigate(path);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className="action-sheet"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h3>{t('mobile.newAction')}</h3>
        <button type="button" className="action-sheet-btn" onClick={() => go('/expenses/new')} data-action="new-expense">
          {t('mobile.newExpense')}
        </button>
        <button type="button" className="action-sheet-btn" onClick={() => go('/reminders/new')} data-action="new-reminder">
          {t('mobile.newReminder')}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
