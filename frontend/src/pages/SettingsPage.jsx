import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { authApi } from '../services/apiService.js';
import { SUPPORTED_CURRENCIES } from '../constants/currencies.js';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { username, currency, updateCurrency } = useAuth();
  const [selected, setSelected] = useState(currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      <h1 style={{ marginBottom: '1.5rem' }}>Settings</h1>
      <p style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>
        Logged in as <strong style={{ color: 'var(--text)' }}>{username}</strong>
      </p>

      {success && <ErrorBanner message="Currency updated successfully." type="success" />}
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div className="form-group">
          <label htmlFor="settings-currency">Preferred currency</label>
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
          {loading ? 'Saving…' : 'Save'}
        </button>
      </form>

      <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Linked accounts</h2>

      {linkSuccess && <ErrorBanner message={linkSuccess} type="success" />}
      {linkError && <ErrorBanner message={linkError} />}

      {providers && (
        googleLinked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Google account connected</span>
            {providers.hasPassword ? (
              <button
                className={styles.settingsLink}
                onClick={handleUnlink}
                disabled={unlinking}
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                {unlinking ? 'Disconnecting…' : 'Disconnect Google'}
              </button>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
                Set a password before disconnecting Google.
              </span>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: '300px' }}>
            <GoogleSignInButton
              mode="link"
              onSuccess={() => {
                setLinkSuccess('Google account connected.');
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
        Change password
      </Link>
    </div>
  );
}
