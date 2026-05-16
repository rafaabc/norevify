import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const { username } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.5rem' }}>{t('auth.changePassword.heading')}</h1>
      <p style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>
        Logged in as <strong style={{ color: 'var(--text)' }}>{username}</strong>
      </p>

      {success && <ErrorBanner message={t('auth.changePassword.success')} type="success" />}
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div className="form-group">
          <label htmlFor="cp-currentPassword">{t('auth.changePassword.current')}</label>
          <input id="cp-currentPassword" type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} required autoFocus />
        </div>
        <div className="form-group">
          <label htmlFor="cp-newPassword">{t('auth.changePassword.new')}</label>
          <input id="cp-newPassword" type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required minLength={8} maxLength={20} />
        </div>
        <div className="form-group">
          <label htmlFor="cp-confirmPassword">Confirm new password</label>
          <input id="cp-confirmPassword" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required minLength={8} maxLength={20} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t('auth.changePassword.submitting') : t('auth.changePassword.submit')}
        </button>
      </form>
    </div>
  );
}
