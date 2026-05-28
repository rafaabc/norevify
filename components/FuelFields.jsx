'use client';
import { useTranslation } from 'react-i18next';
import FieldLabelWithHint from '@/components/FieldLabelWithHint.jsx';

export default function FuelFields({ litres, pricePerLitre, odometer = '', onChange }) {
  const { t } = useTranslation();
  const computed = (parseFloat(litres) > 0 && parseFloat(pricePerLitre) > 0)
    ? (Math.round(parseFloat(litres) * parseFloat(pricePerLitre) * 100) / 100).toFixed(2)
    : null;

  return (
    <>
      <div className="form-group">
        <FieldLabelWithHint htmlFor="field-litres" label={t('expenses.fields.litres')} hint={t('expenses.fields.decimalHint')} />
        <input
          id="field-litres"
          type="number"
          name="litres"
          value={litres}
          onChange={onChange}
          min="0.01"
          step="0.01"
          placeholder="e.g. 40"
          required
        />
      </div>
      <div className="form-group">
        <FieldLabelWithHint htmlFor="field-price-per-litre" label={t('expenses.fields.pricePerLitre')} hint={t('expenses.fields.decimalHint')} />
        <input
          id="field-price-per-litre"
          type="number"
          name="price_per_litre"
          value={pricePerLitre}
          onChange={onChange}
          min="0.01"
          step="0.01"
          placeholder="e.g. 5.50"
          required
        />
      </div>
      <div className="form-group">
        <FieldLabelWithHint htmlFor="field-odometer" label={t('expenses.fields.odometer')} hint={t('expenses.fields.odometerHint')} />
        <input
          id="field-odometer"
          type="number"
          name="odometer"
          value={odometer}
          onChange={onChange}
          min="0"
          step="1"
          placeholder="e.g. 12500"
        />
      </div>
      <div className="form-group">
        <FieldLabelWithHint htmlFor="field-amount" label={t('expenses.fields.amount')} hint={t('expenses.fields.amountTooltip')} />
        <input
          id="field-amount"
          type="number"
          value={computed ?? ''}
          disabled
          readOnly
          onChange={() => {}}
          style={{
            background: 'var(--surface)',
            border: 'none',
            color: computed ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'not-allowed',
          }}
        />
      </div>
    </>
  );
}
