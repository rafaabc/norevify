import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/apiService.js';
import { bindField } from '../utils/form.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import AuthBrandPanel from '../components/AuthBrandPanel.jsx';
import { SUPPORTED_CURRENCIES } from '../constants/currencies.js';
import { detectCurrency } from '../utils/detectCurrency.js';
import styles from './LoginPage.module.css';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', currency: detectCurrency() });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = bindField(setForm);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      navigate('/login', { state: { justRegistered: true } });
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
          <h1 className={styles.formHeading}>{t('auth.register.heading')}</h1>

          {error && <ErrorBanner message={error} />}

          <GoogleSignInButton mode="register" onError={setError} />

          <div className={styles.divider}><span>{t('common.or')}</span></div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reg-username">{t('auth.register.username')}</label>
              <input id="reg-username" name="username" value={form.username} onChange={handleChange} required autoFocus
                minLength={3} maxLength={50} pattern="[a-zA-Z0-9_]+"
                title="3–50 characters: letters, numbers, underscore" />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">{t('auth.register.email')}</label>
              <input id="reg-email" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">{t('auth.register.password')}</label>
              <input id="reg-password" type="password" name="password" value={form.password} onChange={handleChange} required
                minLength={8} maxLength={20} />
            </div>
            <div className="form-group">
              <label htmlFor="reg-currency">{t('auth.register.currency')}</label>
              <select id="reg-currency" name="currency" value={form.currency} onChange={handleChange}>
                {SUPPORTED_CURRENCIES.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </form>

          <p className={styles.switchLink}>
            {t('auth.register.hasAccount')} <Link to="/login">{t('auth.register.signIn')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
