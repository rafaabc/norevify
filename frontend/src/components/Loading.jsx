import { useTranslation } from 'react-i18next';

export default function Loading() {
  const { t } = useTranslation();
  return (
    <div className="text-center" style={{ padding: '3rem 0' }}>
      <div className="spinner" />
      <span>{t('common.loading')}</span>
    </div>
  );
}
