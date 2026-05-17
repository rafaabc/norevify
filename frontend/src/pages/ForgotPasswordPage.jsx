import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/apiService.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import AuthBrandPanel from '../components/AuthBrandPanel.jsx';
import styles from './LoginPage.module.css';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
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
          <h1 className={styles.formHeading}>{t('auth.forgotPassword.heading')}</h1>

          {error && <ErrorBanner message={error} />}

          {submitted ? (
            <>
              <ErrorBanner
                message={t('auth.forgotPassword.success')}
                type="success"
              />
              <p className={styles.switchLink}>
                <Link to="/login">{t('auth.forgotPassword.backToLogin')}</Link>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="forgot-email">{t('auth.forgotPassword.email')}</label>
                  <input
                    id="forgot-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
                </button>
              </form>
              <p className={styles.switchLink}>
                <Link to="/login">{t('auth.forgotPassword.backToLogin')}</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
