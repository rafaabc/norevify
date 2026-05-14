import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { SUPPORTED_CURRENCIES } from '../constants/currencies.js';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { username, currency, updateCurrency } = useAuth();
  const [selected, setSelected] = useState(currency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    </div>
  );
}
