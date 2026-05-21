'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar.jsx';
import MobileTopBar from './MobileTopBar.jsx';
import BottomTabs from './BottomTabs.jsx';
import styles from './AppShell.module.css';
import { useAuth } from '@/context/AuthContext.jsx';
import { remindersApi, authApi } from '@/services/apiService.js';

function useReminderBadge(isAuthed) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      setCount(0);
      return;
    }
    let cancelled = false;

    async function fetchCount() {
      try {
        const { dueSoon, overdue } = await remindersApi.badgeCount();
        if (!cancelled) setCount((dueSoon || 0) + (overdue || 0));
      } catch {
        // silently ignore — badge is best-effort
      }
    }

    fetchCount();

    function onChanged() { fetchCount(); }
    window.addEventListener('reminders:changed', onChanged);
    window.addEventListener('focus', onChanged);

    return () => {
      cancelled = true;
      window.removeEventListener('reminders:changed', onChanged);
      window.removeEventListener('focus', onChanged);
    };
  }, [isAuthed, pathname]);

  return count;
}

function EmailVerificationBanner({ emailVerified }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (emailVerified !== false) return null;

  async function handleResend() {
    setSending(true);
    try {
      await authApi.resendVerification();
      setSent(true);
    } catch {
      // best-effort
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      background: '#854d0e',
      color: '#fef9c3',
      padding: '0.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '0.875rem',
    }}>
      <span style={{ flex: 1 }}>
        {sent ? t('auth.verifyEmail.resendSuccess') : t('auth.verifyEmail.bannerText')}
      </span>
      {!sent && (
        <button
          onClick={handleResend}
          disabled={sending}
          style={{
            background: 'none',
            border: '1px solid #fef9c3',
            color: '#fef9c3',
            borderRadius: '4px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            whiteSpace: 'nowrap',
          }}
        >
          {sending ? t('auth.verifyEmail.resending') : t('auth.verifyEmail.bannerAction')}
        </button>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  const { t } = useTranslation();
  const { isAuthed, emailVerified } = useAuth();
  const badgeCount = useReminderBadge(isAuthed);

  return (
    <div className={styles.shell}>
      <Sidebar badgeCount={badgeCount} />
      <MobileTopBar badgeCount={badgeCount} />
      <main className={styles.main}>
        <EmailVerificationBanner emailVerified={emailVerified} />
        {children}
        <footer style={{
          padding: '1.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--muted)',
          borderTop: '1px solid var(--border)',
        }}>
          <Link href="/privacy" style={{ color: 'var(--muted)' }}>{t('legal.privacy')}</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'var(--muted)' }}>{t('legal.terms')}</Link>
        </footer>
      </main>
      <BottomTabs />
    </div>
  );
}
