import { useTranslation } from 'react-i18next';
import { CATEGORIES, categoryLabel } from '../utils/categories.js';

export default function CategorySelect({ value, onChange, includeAll = false, name = 'category', id }) {
  const { t } = useTranslation();
  return (
    <select name={name} value={value} onChange={onChange} id={id}>
      {includeAll && <option value="">{t('categories.all')}</option>}
      {!includeAll && <option value="">{t('categories.all')}</option>}
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>{categoryLabel(c, t)}</option>
      ))}
    </select>
  );
}
