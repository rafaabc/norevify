import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';

/* eslint-disable react/prop-types */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

export default function GoogleSignInButton({ mode = 'login', onSuccess, onError }) {
  const { login } = useAuth() || {};
  const navigate = useNavigate();
  const containerRef = useRef(null);

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

      if (mode === 'login' || mode === 'register') {
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
  }, [mode]);

  async function handleCredential({ credential }) {
    try {
      if (mode === 'link') {
        await authApi.linkGoogle({ idToken: credential });
        onSuccess?.();
      } else {
        const { token } = await authApi.googleLogin({ idToken: credential });
        login(token);
        navigate('/', { state: { justLoggedIn: true } });
      }
    } catch (err) {
      onError?.(err.message);
    }
  }

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} style={{ width: '100%' }} />;
}
