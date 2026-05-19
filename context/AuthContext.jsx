'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { decodeJwt } from '@/utils/decodeJwt.js';
import { authApi } from '@/services/apiService.js';
import { DEFAULT_CURRENCY } from '@/constants/currencies.js';
import i18n from '@/i18n/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setToken(stored);
  }, []);
  const [expiredBanner, setExpiredBanner] = useState(false);
  const router = useRouter();

  const login = useCallback((newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setExpiredBanner(false);
    const payload = decodeJwt(newToken);
    if (payload?.language && !localStorage.getItem('i18nextLng')) {
      localStorage.setItem('i18nextLng', payload.language);
      i18n.changeLanguage(payload.language);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/login?loggedOut=1');
  }, [router]);

  useEffect(() => {
    function handleExpiry() {
      setToken(null);
      setExpiredBanner(true);
      router.push('/login');
    }
    window.addEventListener('auth:logout', handleExpiry);
    return () => window.removeEventListener('auth:logout', handleExpiry);
  }, [router]);

  const decoded = token ? decodeJwt(token) : null;
  const username = decoded?.username ?? null;
  const currency = decoded?.currency ?? DEFAULT_CURRENCY;
  const language = decoded?.language ?? 'pt-BR';

  const updateCurrency = useCallback(async (newCurrency) => {
    const { token: newToken } = await authApi.updateCurrency({ currency: newCurrency });
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const updateLanguage = useCallback(async (newLanguage) => {
    const { token: newToken } = await authApi.updateLanguage({ language: newLanguage });
    localStorage.setItem('token', newToken);
    setToken(newToken);
    localStorage.setItem('i18nextLng', newLanguage);
    i18n.changeLanguage(newLanguage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthed: !!token, username, currency, language, updateCurrency, updateLanguage, login, logout, expiredBanner, clearExpiredBanner: () => setExpiredBanner(false) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
