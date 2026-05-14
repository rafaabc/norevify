import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { authApi } from '../services/apiService.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import styles from './LoginPage.module.css';

export default function ForgotPasswordPage() {
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
      <aside className={styles.brand}>
        <div className={styles.brandContent}>
          <Gauge size={64} strokeWidth={1.5} className={styles.brandIcon} />
          <span className={styles.wordmark}>DRIVELEDGER</span>
          <p className={styles.tagline}>Track every kilometer.</p>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.formHeading}>Recover password</h1>

          {error && <ErrorBanner message={error} />}

          {submitted ? (
            <>
              <ErrorBanner
                message="If the email is registered, you will receive a reset link shortly."
                type="success"
              />
              <p className={styles.switchLink}>
                <Link to="/login">Back to Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="forgot-email">Email</label>
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
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p className={styles.switchLink}>
                <Link to="/login">Back to Sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
