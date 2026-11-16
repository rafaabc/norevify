'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import FieldLabelWithHint from '@/components/FieldLabelWithHint.jsx';
import GoogleSignInButton from '@/components/GoogleSignInButton.jsx';
import AuthBrandPanel from '@/components/AuthBrandPanel.jsx';
import { SUPPORTED_CURRENCIES } from '@/constants/currencies.js';
import { detectCurrency } from '@/utils/detectCurrency.js';
import styles from './LoginPage.module.css';

const POLICY_VERSION = '2026-05-20';

export default function RegisterPage() {
  const { t } = useTranslation();
  const INVITE_ONLY = process.env.NEXT_PUBLIC_INVITE_ONLY === 'true';
  const [inviteCode, setInviteCode] = useState('');
  const [currency, setCurrency] = useState(detectCurrency());
  const [consented, setConsented] = useState(false);
  // Captured when the box is ticked, so the stored acceptance time is the moment the
  // user agreed rather than the moment Google's popup returned.
  const [acceptedAt, setAcceptedAt] = useState(null);
  const [error, setError] = useState('');

  function handleConsentChange(e) {
    setConsented(e.target.checked);
    setAcceptedAt(e.target.checked ? new Date().toISOString() : null);
  }

  const consent =
    consented && acceptedAt ? { policyVersion: POLICY_VERSION, acceptedAt } : undefined;
  // Google sign-up stays locked until the required inputs are in place.
  const locked = !consent || (INVITE_ONLY && !inviteCode.trim());

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <h1 className={styles.formHeading}>{t('auth.register.heading')}</h1>

          {error && <ErrorBanner message={error} />}

          {INVITE_ONLY && (
            <div className="form-group">
              <FieldLabelWithHint
                htmlFor="reg-invite-code"
                label={t('auth.register.inviteLabel')}
                hint={t('auth.register.inviteHint')}
              />
              <input
                id="reg-invite-code"
                name="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="reg-currency">{t('auth.register.currency')}</label>
            <select
              id="reg-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}
          >
            <input
              id="reg-consent"
              type="checkbox"
              checked={consented}
              onChange={handleConsentChange}
              style={{ marginTop: '0.25rem', flexShrink: 0 }}
            />
            <label
              htmlFor="reg-consent"
              style={{ cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1.4 }}
            >
              {t('auth.register.consentLabel')}{' '}
              <Link
                href="/privacy"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                {t('auth.register.privacyPolicy')}
              </Link>{' '}
              {t('auth.register.consentAnd')}{' '}
              <Link
                href="/terms"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                {t('auth.register.termsOfService')}
              </Link>
              .
            </label>
          </div>

          <GoogleSignInButton
            mode="register"
            onError={setError}
            inviteCode={inviteCode}
            consent={consent}
            currency={currency}
            disabled={locked}
          />

          <p className={styles.switchLink}>
            {t('auth.register.hasAccount')} <Link href="/login">{t('auth.register.signIn')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
