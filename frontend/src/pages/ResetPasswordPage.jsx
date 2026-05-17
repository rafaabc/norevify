import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/apiService.js';
import { bindField } from '../utils/form.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import AuthBrandPanel from '../components/AuthBrandPanel.jsx';
import styles from './LoginPage.module.css';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true });
  }, [token, navigate]);

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
      navigate('/login', { state: { passwordChanged: true } });
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
            <Link to="/forgot-password">{t('auth.resetPassword.requestNew')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
