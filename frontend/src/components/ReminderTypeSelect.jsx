import { useTranslation } from 'react-i18next';

export const REMINDER_TYPES = ['oilChange', 'tireRotation', 'inspection', 'insurance', 'license', 'other'];

export default function ReminderTypeSelect({ value, onChange, id = 'field-reminder-type' }) {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <label htmlFor={id}>{t('reminders.fields.type')}</label>
      <select id={id} name="type" value={value} onChange={onChange}>
        {REMINDER_TYPES.map((typeKey) => (
          <option key={typeKey} value={typeKey}>{t(`reminderTypes.${typeKey}`)}</option>
        ))}
      </select>
    </div>
  );
}
