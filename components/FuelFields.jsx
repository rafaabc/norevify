'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

export default function FuelFields({ litres, pricePerLitre, odometer = '', onChange }) {
  const { t } = useTranslation();
  const [showHint, setShowHint] = useState(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
          <label htmlFor="field-amount">{t('expenses.fields.amount')}</label>
          <button
            type="button"
            aria-label={t('expenses.fields.amountTooltip')}
            aria-expanded={showHint}
            onClick={() => setShowHint((v) => !v)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <Info size={14} />
          </button>
        </div>
        {showHint && (
          <small style={{ color: 'var(--text-muted)', marginBottom: '.35rem', display: 'block' }}>
            {t('expenses.fields.amountTooltip')}
          </small>
        )}
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
