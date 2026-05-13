import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { authApi } from '../services/apiService.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
// Reuses LoginPage styles intentionally — see spec 2026-05-13
import styles from './LoginPage.module.css';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({ username: form.username, newPassword: form.newPassword });
      navigate('/login', { state: { passwordChanged: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <aside className={styles.brand}>
        <div className={styles.brandContent}>
          <Gauge size={64} strokeWidth={1.5} className={styles.brandIcon} />
          <span className={styles.wordmark}>DRIVELEDGER</span>
          <p className={styles.tagline}>Track every kilometer.</p>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.formHeading}>Change password</h1>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cp-username">Username</label>
              <input id="cp-username" name="username" value={form.username} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="cp-newPassword">New password</label>
              <input id="cp-newPassword" type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="cp-confirmPassword">Confirm new password</label>
              <input id="cp-confirmPassword" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Updating…' : 'Change password'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
