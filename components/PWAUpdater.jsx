'use client';
import { useEffect, useState } from 'react';
import UpdatePrompt from './UpdatePrompt';

export default function PWAUpdater() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingSW, setWaitingSW] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
        setShowPrompt(true);
      }
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(newSW);
            setShowPrompt(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    waitingSW?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  if (!showPrompt) return null;
  return <UpdatePrompt onUpdate={handleUpdate} />;
}
