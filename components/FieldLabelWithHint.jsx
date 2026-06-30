'use client';
import { useState } from 'react';
import { Info } from 'lucide-react';

export default function FieldLabelWithHint({ htmlFor, label, hint }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
        <label htmlFor={htmlFor}>{label}</label>
        <button
          type="button"
          aria-label={hint}
          aria-expanded={show}
          onClick={() => setShow((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Info size={14} />
        </button>
      </div>
      {show && (
        <small style={{ color: 'var(--muted)', marginBottom: '.35rem', display: 'block' }}>
          {hint}
        </small>
      )}
    </>
  );
}
