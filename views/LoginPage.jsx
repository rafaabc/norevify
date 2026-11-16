'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext.jsx';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import GoogleSignInButton from '@/components/GoogleSignInButton.jsx';
import AuthBrandPanel from '@/components/AuthBrandPanel.jsx';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { expiredBanner, clearExpiredBanner } = useAuth();
  const searchParams = useSearchParams();
  const [showLoggedOut, setShowLoggedOut] = useState(searchParams.get('loggedOut') === '1');
  const [showDeleted, setShowDeleted] = useState(searchParams.get('deleted') === '1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!showLoggedOut) return;
    const timer = setTimeout(() => setShowLoggedOut(false), 3000);
    return () => clearTimeout(timer);
  }, [showLoggedOut]);

  useEffect(() => {
    if (!showDeleted) return;
    const timer = setTimeout(() => setShowDeleted(false), 3000);
    return () => clearTimeout(timer);
  }, [showDeleted]);

  useEffect(() => {
    if (!expiredBanner) return;
    const timer = setTimeout(clearExpiredBanner, 3000);
    return () => clearTimeout(timer);
  }, [expiredBanner, clearExpiredBanner]);

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.formHeading}>{t('auth.login.heading')}</h1>

          {expiredBanner && <ErrorBanner message={t('auth.login.sessionExpired')} type="info" />}
          {showLoggedOut && <ErrorBanner message={t('auth.login.loggedOut')} type="success" />}
          {showDeleted && <ErrorBanner message={t('auth.login.accountDeleted')} type="success" />}
          {error && <ErrorBanner message={error} />}

          <GoogleSignInButton mode="login" onError={setError} />

          <p className={styles.switchLink}>
            {t('auth.login.noAccount')} <Link href="/register">{t('auth.login.register')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
