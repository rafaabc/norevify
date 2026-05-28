'use client';
import { useTranslation } from 'react-i18next';
import FieldLabelWithHint from '@/components/FieldLabelWithHint.jsx';
import NumericInput from '@/components/NumericInput.jsx';

export default function AmountField({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <FieldLabelWithHint htmlFor="field-amount" label={t('expenses.fields.amount')} hint={t('expenses.fields.decimalHint')} />
      <NumericInput
        id="field-amount"
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
