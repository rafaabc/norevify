import { useTranslation } from 'react-i18next';

export default function AmountField({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <label htmlFor="field-amount">{t('expenses.fields.amount')}</label>
      <input
        id="field-amount"
        type="number"
        name="amount"
        value={value}
        onChange={onChange}
        min="0.01"
        step="0.01"
        placeholder="e.g. 150.00"
        required
      />
    </div>
  );
}
