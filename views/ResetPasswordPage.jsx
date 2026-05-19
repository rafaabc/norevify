'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/services/apiService.js';
import { bindField } from '@/utils/form.js';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import AuthBrandPanel from '@/components/AuthBrandPanel.jsx';
import styles from './LoginPage.module.css';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/forgot-password');
  }, [token, router]);

  const handleChange = bindField(setForm);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword });
      router.push('/login?passwordChanged=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.formHeading}>{t('auth.resetPassword.heading')}</h1>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-password">{t('auth.resetPassword.newPassword')}</label>
              <input
                id="reset-password"
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={8}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-confirm">{t('auth.resetPassword.confirm')}</label>
              <input
                id="reset-confirm"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                maxLength={20}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
            </button>
          </form>

          <p className={styles.switchLink}>
            <Link href="/forgot-password">{t('auth.resetPassword.requestNew')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
