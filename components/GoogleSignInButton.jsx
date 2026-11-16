'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/services/apiService.js';
import { useAuth } from '@/context/AuthContext.jsx';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

let scriptInjected = false;

function injectGisScript() {
  if (scriptInjected || document.getElementById('gis-script')) return;
  scriptInjected = true;
  const s = document.createElement('script');
  s.id = 'gis-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

// Modes:
//   login    — sign in; also the entry point for an existing account
//   register — sign up; sends the consent record (and currency) for a new account
//   reauth   — hands the fresh ID token to `onCredential` instead of signing in, so a
//              sensitive action (deleting the account) can re-prove control of Google
export default function GoogleSignInButton({
  mode = 'login',
  onCredential,
  onError,
  inviteCode,
  consent,
  currency,
  disabled = false,
}) {
  const { login } = useAuth() || {};
  const router = useRouter();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  // Ref, not state, for the guard: GIS holds the callback from initialize(), so a
  // state value captured in its closure would be stale on a second fire.
  const pendingRef = useRef(false);
  const disabledRef = useRef(disabled);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const handleCredential = useCallback(
    async ({ credential }) => {
      if (pendingRef.current || disabledRef.current) return;
      pendingRef.current = true;
      setPending(true);
      try {
        if (mode === 'reauth') {
          await onCredential?.(credential);
          pendingRef.current = false;
          setPending(false);
        } else {
          const { token } = await authApi.googleLogin({
            idToken: credential,
            inviteCode,
            consent,
            currency,
          });
          login(token);
          // Stays pending until navigation unmounts this page.
          router.push('/');
        }
      } catch (err) {
        pendingRef.current = false;
        setPending(false);
        onError?.(err.message);
      }
    },
    [mode, login, router, onCredential, onError, inviteCode, consent, currency],
  );

  useEffect(() => {
    if (!CLIENT_ID) return;
    injectGisScript();

    let interval;

    function init() {
      if (!globalThis.google?.accounts?.id || !containerRef.current) return;

      globalThis.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });

      globalThis.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: containerRef.current.offsetWidth || 360,
        text: mode === 'register' ? 'signup_with' : 'signin_with',
      });

      // One Tap only on the login page: on register it would fire before the user has
      // ticked the consent box, and on reauth it would sign in instead of confirming.
      if (mode === 'login' && process.env.NODE_ENV !== 'development') {
        globalThis.google.accounts.id.prompt();
      }
    }

    if (globalThis.google?.accounts?.id) {
      init();
    } else {
      interval = setInterval(() => {
        if (globalThis.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 100);
    }

    return () => clearInterval(interval);
  }, [mode, handleCredential]);

  if (!CLIENT_ID) return null;

  return (
    <div aria-busy={pending} aria-disabled={disabled}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          pointerEvents: pending || disabled ? 'none' : undefined,
          opacity: pending || disabled ? 0.6 : undefined,
        }}
      />
      {pending && (
        <output style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem' }}>
          {t('auth.login.submitting')}
        </output>
      )}
    </div>
  );
}

GoogleSignInButton.propTypes = {
  mode: PropTypes.oneOf(['login', 'register', 'reauth']),
  onCredential: PropTypes.func,
  onError: PropTypes.func,
  inviteCode: PropTypes.string,
  consent: PropTypes.shape({
    policyVersion: PropTypes.string,
    acceptedAt: PropTypes.string,
  }),
  currency: PropTypes.string,
  disabled: PropTypes.bool,
};
