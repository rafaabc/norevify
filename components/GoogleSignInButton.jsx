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

export default function GoogleSignInButton({ mode = 'login', onSuccess, onError, inviteCode }) {
  const { login } = useAuth() || {};
  const router = useRouter();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  // Ref, not state, for the guard: GIS holds the callback from initialize(), so a
  // state value captured in its closure would be stale on a second fire.
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);

  const handleCredential = useCallback(
    async ({ credential }) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      try {
        if (mode === 'link') {
          await authApi.linkGoogle({ idToken: credential });
          pendingRef.current = false;
          setPending(false);
          onSuccess?.();
        } else {
          const { token } = await authApi.googleLogin({ idToken: credential, inviteCode });
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
    [mode, login, router, onSuccess, onError, inviteCode],
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

      if ((mode === 'login' || mode === 'register') && process.env.NODE_ENV !== 'development') {
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
    <div aria-busy={pending}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          pointerEvents: pending ? 'none' : undefined,
          opacity: pending ? 0.6 : undefined,
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
  mode: PropTypes.oneOf(['login', 'register', 'link']),
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  inviteCode: PropTypes.string,
};
