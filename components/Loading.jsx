'use client';
import { useTranslation } from 'react-i18next';

export default function Loading() {
  const { t } = useTranslation();
  return (
    <div className="text-center" style={{ padding: '3rem 0' }} aria-label={t('common.loading')}>
      <div className="spinner" />
    </div>
  );
}
