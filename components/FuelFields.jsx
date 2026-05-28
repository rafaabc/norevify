'use client';
import { useTranslation } from 'react-i18next';

export default function FuelFields({ litres, pricePerLitre, odometer = '', onChange }) {
  const { t } = useTranslation();
  const computed = (parseFloat(litres) > 0 && parseFloat(pricePerLitre) > 0)
    ? (Math.round(parseFloat(litres) * parseFloat(pricePerLitre) * 100) / 100).toFixed(2)
    : null;

  return (
    <>
      <div className="form-group">
        <label htmlFor="field-litres">{t('expenses.fields.litres')}</label>
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
        <label htmlFor="field-price-per-litre">{t('expenses.fields.pricePerLitre')}</label>
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
        <label htmlFor="field-odometer">{t('expenses.fields.odometer')}</label>
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
        <label htmlFor="field-amount">{t('expenses.fields.amount')}</label>
        <input
          id="field-amount"
          type="number"
          value={computed ?? ''}
          disabled
          readOnly
          title={t('expenses.fields.amountTooltip')}
          onChange={() => {}}
        />
      </div>
    </>
  );
}
