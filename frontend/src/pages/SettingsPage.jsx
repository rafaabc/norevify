import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { authApi } from '../services/apiService.js';
import { SUPPORTED_CURRENCIES } from '../constants/currencies.js';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { username, currency, updateCurrency, language, updateLanguage } = useAuth();
  const [selected, setSelected] = useState(currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [selectedLang, setSelectedLang] = useState(language);
  const [langLoading, setLangLoading] = useState(false);
  const [langError, setLangError] = useState('');
  const [langSuccess, setLangSuccess] = useState(false);

  const [providers, setProviders] = useState(null);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    authApi.getProviders().then(setProviders).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await updateCurrency(selected);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLangSubmit(e) {
    e.preventDefault();
    setLangError('');
    setLangSuccess(false);
    setLangLoading(true);
    try {
      await updateLanguage(selectedLang);
      setLangSuccess(true);
    } catch (err) {
      setLangError(err.message);
    } finally {
      setLangLoading(false);
    }
  }

  async function handleUnlink() {
    setLinkError('');
    setLinkSuccess('');
    setUnlinking(true);
    try {
      await authApi.unlinkGoogle();
      setLinkSuccess('Google account disconnected.');
      setProviders((p) => ({
        ...p,
        authProviders: p.authProviders.filter((x) => x !== 'google'),
      }));
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setUnlinking(false);
    }
  }

  const googleLinked = providers?.authProviders?.includes('google');

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.5rem' }}>{t('settings.heading')}</h1>
      <p style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>
        {t('settings.loggedInAs')} <strong style={{ color: 'var(--text)' }}>{username}</strong>
      </p>

      {success && <ErrorBanner message={t('settings.currency.success')} type="success" />}
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div className="form-group">
          <label htmlFor="settings-currency">{t('settings.currency.label')}</label>
          <select
            id="settings-currency"
            value={selected}
            onChange={(e) => { setSelected(e.target.value); setSuccess(false); }}
          >
            {SUPPORTED_CURRENCIES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={loading || selected === currency}>
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </form>

      <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

      {langSuccess && <ErrorBanner message={t('settings.language.success')} type="success" />}
      {langError && <ErrorBanner message={langError} />}

      <form onSubmit={handleLangSubmit} style={{ maxWidth: '400px' }}>
        <div className="form-group">
          <label htmlFor="settings-language">{t('settings.language.label')}</label>
          <select
            id="settings-language"
            value={selectedLang}
            onChange={(e) => { setSelectedLang(e.target.value); setLangSuccess(false); }}
            disabled={langLoading}
          >
            <option value="en">English</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={langLoading || selectedLang === language}>
          {langLoading ? t('common.saving') : t('common.save')}
        </button>
      </form>

      <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('settings.linkedAccounts')}</h2>

      {linkSuccess && <ErrorBanner message={linkSuccess} type="success" />}
      {linkError && <ErrorBanner message={linkError} />}

      {providers && (
        googleLinked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('settings.googleConnected')}</span>
            {providers.hasPassword ? (
              <button
                className={styles.settingsLink}
                onClick={handleUnlink}
                disabled={unlinking}
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                {unlinking ? t('settings.disconnecting') : t('settings.disconnectGoogle')}
              </button>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
                {t('settings.setPasswordFirst')}
              </span>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: '300px' }}>
            <GoogleSignInButton
              mode="link"
              onSuccess={() => {
                setLinkSuccess(t('settings.googleConnected'));
                setProviders((p) => ({ ...p, authProviders: [...(p?.authProviders ?? []), 'google'] }));
              }}
              onError={setLinkError}
            />
          </div>
        )
      )}

      <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

      <Link to="/change-password" className={styles.settingsLink}>
        <KeyRound size={16} />
        {t('settings.changePassword')}
      </Link>
    </div>
  );
}
