import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { bindField } from '../utils/form.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import AuthBrandPanel from '../components/AuthBrandPanel.jsx';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, expiredBanner, clearExpiredBanner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRegistered, setShowRegistered] = useState(!!location.state?.justRegistered);
  const [showLoggedOut, setShowLoggedOut] = useState(!!location.state?.justLoggedOut);
  const [showPasswordChanged, setShowPasswordChanged] = useState(!!location.state?.passwordChanged);

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showRegistered) return;
    const t = setTimeout(() => setShowRegistered(false), 3000);
    return () => clearTimeout(t);
  }, [showRegistered]);

  useEffect(() => {
    if (!showLoggedOut) return;
    const t = setTimeout(() => setShowLoggedOut(false), 3000);
    return () => clearTimeout(t);
  }, [showLoggedOut]);

  useEffect(() => {
    if (!showPasswordChanged) return;
    const t = setTimeout(() => setShowPasswordChanged(false), 3000);
    return () => clearTimeout(t);
  }, [showPasswordChanged]);

  useEffect(() => {
    if (!expiredBanner) return;
    const t = setTimeout(clearExpiredBanner, 3000);
    return () => clearTimeout(t);
  }, [expiredBanner, clearExpiredBanner]);

  const handleChange = bindField(setForm);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    clearExpiredBanner();
    setLoading(true);
    try {
      const { token } = await authApi.login(form);
      login(token);
      navigate('/', { state: { justLoggedIn: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />

      {/* Form panel */}
      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.formHeading}>{t('auth.login.heading')}</h1>

          {expiredBanner && <ErrorBanner message={t('auth.login.sessionExpired')} type="info" />}
          {showLoggedOut && <ErrorBanner message={t('auth.login.loggedOut')} type="success" />}
          {showRegistered && <ErrorBanner message={t('auth.login.accountCreated')} type="success" />}
          {showPasswordChanged && <ErrorBanner message={t('auth.login.passwordChanged')} type="success" />}
          {error && <ErrorBanner message={error} />}

          <GoogleSignInButton mode="login" onError={setError} />

          <div className={styles.divider}><span>{t('common.or')}</span></div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-username">{t('auth.register.username')}</label>
              <input id="login-username" name="username" value={form.username} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">{t('auth.register.password')}</label>
              <input id="login-password" type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>

          <p className={styles.switchLink}>
            {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.register')}</Link>
          </p>
          <p className={styles.switchLink}>
            <Link to="/forgot-password">{t('auth.login.forgotPassword')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
