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
        <label>
          {t('expenses.fields.amount')}
          <span style={{
            marginLeft: '.5rem',
            fontSize: '.75rem',
            fontWeight: 400,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}>
            ({t('expenses.fields.amountAutoHint')})
          </span>
        </label>
        <div
          aria-label={t('expenses.fields.amount')}
          style={{
            padding: '.5rem .8rem',
            background: computed ? 'var(--primary-dim)' : 'var(--surface-2, var(--surface))',
            border: `1px solid ${computed ? 'var(--primary-glow)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '.9rem',
            color: computed ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: computed ? 600 : 400,
            cursor: 'not-allowed',
            userSelect: 'none',
            minHeight: '2.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {computed ?? t('expenses.fields.amountPending')}
        </div>
      </div>
    </>
  );
}
