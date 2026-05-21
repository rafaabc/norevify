'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext.jsx';
import { authApi } from '@/services/apiService.js';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import styles from './LoginPage.module.css';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setErrorMsg(t('auth.verifyEmail.invalid'));
      setStatus('error');
      return;
    }
    authApi.verifyEmail({ token })
      .then(({ token: newToken }) => {
        login(newToken);
        setStatus('success');
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend() {
    setResendError('');
    setResendSuccess(false);
    setResendLoading(true);
    try {
      await authApi.resendVerification();
      setResendSuccess(true);
    } catch (err) {
      setResendError(err.message);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <main className={styles.formPanel} style={{ justifyContent: 'center' }}>
        <div className={styles.formCard} style={{ textAlign: 'center' }}>
          <h1 className={styles.formHeading}>{t('auth.verifyEmail.heading')}</h1>

          {status === 'verifying' && (
            <p style={{ color: 'var(--muted)' }}>{t('auth.verifyEmail.verifying')}</p>
          )}

          {status === 'success' && (
            <>
              <ErrorBanner message={t('auth.verifyEmail.success')} type="success" />
              <button
                className="btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => router.push('/dashboard')}
              >
                {t('auth.verifyEmail.goToDashboard')}
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorBanner message={errorMsg} />
              {resendSuccess && <ErrorBanner message={t('auth.verifyEmail.resendSuccess')} type="success" />}
              {resendError && <ErrorBanner message={resendError} />}
              <button
                className="btn-secondary"
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={handleResend}
                disabled={resendLoading || resendSuccess}
              >
                {resendLoading ? t('auth.verifyEmail.resending') : t('auth.verifyEmail.resend')}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
