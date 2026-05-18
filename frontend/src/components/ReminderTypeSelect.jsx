import { useTranslation } from 'react-i18next';
import { CATEGORIES, categoryLabel } from '../utils/categories.js';

export const REMINDER_TYPES = CATEGORIES;

export default function ReminderTypeSelect({ value, onChange, id = 'field-reminder-type' }) {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <label htmlFor={id}>{t('reminders.fields.type')}</label>
      <select id={id} name="type" value={value} onChange={onChange}>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{categoryLabel(cat, t)}</option>
        ))}
      </select>
    </div>
  );
}
