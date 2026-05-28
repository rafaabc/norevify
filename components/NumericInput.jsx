'use client';
import { useTranslation } from 'react-i18next';

export default function NumericInput({ value, onChange, name, id, placeholder, min, step, ...rest }) {
  const { i18n } = useTranslation();

  if (i18n.language !== 'pt-BR') {
    return (
      <input
        type="number"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        {...rest}
      />
    );
  }

  // PT-BR: show comma as decimal separator, reject period
  const displayValue = String(value ?? '').replace('.', ',');
  const localePlaceholder = placeholder ? placeholder.replace(/\./g, ',') : placeholder;

  function handleChange(e) {
    const raw = e.target.value;
    // Reject anything that isn't digits + at most one comma
    if (raw !== '' && !/^\d*[,]?\d*$/.test(raw)) return;
    onChange({ target: { name, value: raw.replace(',', '.') } });
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      name={name}
      value={displayValue}
      onChange={handleChange}
      placeholder={localePlaceholder}
      {...rest}
    />
  );
}
