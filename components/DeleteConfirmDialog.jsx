'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeleteConfirmDialog({
  open,
  message,
  messages,
  requireDouble = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);

  // Derived-state reset: when parent closes the dialog, reset stage for next open.
  // Called synchronously during render (React-approved getDerivedStateFromProps equivalent).
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setStage(0);
  }

  if (!open) return null;

  const currentMsg = requireDouble ? messages[stage] : message;
  const isFirstStage = requireDouble && stage === 0;

  function handlePrimary() {
    if (isFirstStage) setStage(1);
    else onConfirm();
  }

  return (
    <div role="dialog" aria-modal="true" className="modal-backdrop">
      <div className="modal">
        <p>{currentMsg}</p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-danger" onClick={handlePrimary}>
            {isFirstStage ? 'Continue' : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
