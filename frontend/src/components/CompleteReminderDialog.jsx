import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function addMonths(date, m) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + m);
  return d;
}

export default function CompleteReminderDialog({ open, reminder, onSubmit, onCancel }) {
  const { t, i18n } = useTranslation();
  const [km, setKm] = useState('');

  if (!open || !reminder) return null;

  const parsed = parseFloat(km);
  const validKm = !isNaN(parsed) && parsed >= 0;

  let previewNextKm = null;
  let previewNextDate = null;
  if (validKm && (reminder.intervalMonths || reminder.intervalKm)) {
    previewNextDate = reminder.intervalMonths
      ? addMonths(new Date(), reminder.intervalMonths).toLocaleDateString(i18n.language)
      : null;
    previewNextKm = reminder.intervalKm ? parsed + reminder.intervalKm : null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validKm) onSubmit(parsed);
  }

  return (
    <div role="dialog" aria-modal="true" className="modal-backdrop">
      <form className="modal" onSubmit={handleSubmit}>
        <h3>{t('reminders.actions.complete')}</h3>
        <div className="form-group">
          <label htmlFor="complete-km">{t('reminders.actions.completedKm')}</label>
          <input
            id="complete-km"
            type="number"
            min="0"
            step="1"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            required
          />
        </div>
        {(previewNextKm !== null || previewNextDate !== null) && (
          <p>
            {t('reminders.actions.completePreview')}
            {previewNextDate && ` ${previewNextDate}`}
            {previewNextKm !== null && ` ${previewNextKm}`}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={!validKm}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
