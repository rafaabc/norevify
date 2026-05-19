import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';

vi.mock('@/services/apiService.js', () => ({
  authApi: {
    updateCurrency: vi.fn(),
    updateLanguage: vi.fn(),
  },
}));

vi.mock('@/i18n/index.js', () => ({
  default: { changeLanguage: vi.fn() },
}));

vi.mock('@/constants/currencies.js', () => ({
  DEFAULT_CURRENCY: 'BRL',
}));

function makeToken(payload) {
  return `h.${btoa(JSON.stringify(payload))}.s`;
}

function Consumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authed">{String(auth.isAuthed)}</span>
      <span data-testid="username">{auth.username ?? 'none'}</span>
      <span data-testid="currency">{auth.currency}</span>
      <button onClick={auth.logout}>logout</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AuthProvider', () => {
  it('should report isAuthed false when no token in localStorage', async () => {
    await act(async () => {
      render(<AuthProvider><Consumer /></AuthProvider>);
    });
    expect(screen.getByTestId('authed').textContent).toBe('false');
  });

  it('should report isAuthed true and decode username when token is stored', async () => {
    const token = makeToken({ id: '1', username: 'alice', currency: 'USD', language: 'en' });
    localStorage.setItem('token', token);
    await act(async () => {
      render(<AuthProvider><Consumer /></AuthProvider>);
    });
    expect(screen.getByTestId('authed').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('alice');
    expect(screen.getByTestId('currency').textContent).toBe('USD');
  });

  it('should store token and update state on login', async () => {
    function LoginConsumer() {
      const { login, isAuthed } = useAuth();
      return (
        <>
          <span data-testid="authed">{String(isAuthed)}</span>
          <button onClick={() => login(makeToken({ id: '2', username: 'bob', currency: 'EUR', language: 'pt-BR' }))}>
            login
          </button>
        </>
      );
    }
    await act(async () => { render(<AuthProvider><LoginConsumer /></AuthProvider>); });
    expect(screen.getByTestId('authed').textContent).toBe('false');
    await act(async () => { screen.getByRole('button', { name: 'login' }).click(); });
    expect(screen.getByTestId('authed').textContent).toBe('true');
    expect(localStorage.getItem('token')).toBeTruthy();
  });

  it('should apply language from token payload when no i18nextLng in localStorage', async () => {
    const i18n = (await import('@/i18n/index.js')).default;
    const token = makeToken({ id: '3', username: 'carol', currency: 'USD', language: 'en' });
    function LoginConsumer() {
      const { login } = useAuth();
      return <button onClick={() => login(token)}>login</button>;
    }
    await act(async () => { render(<AuthProvider><LoginConsumer /></AuthProvider>); });
    await act(async () => { screen.getByRole('button', { name: 'login' }).click(); });
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('should not override language from token when i18nextLng already set', async () => {
    const i18n = (await import('@/i18n/index.js')).default;
    localStorage.setItem('i18nextLng', 'pt-BR');
    const token = makeToken({ id: '4', username: 'dan', currency: 'USD', language: 'en' });
    function LoginConsumer() {
      const { login } = useAuth();
      return <button onClick={() => login(token)}>login</button>;
    }
    await act(async () => { render(<AuthProvider><LoginConsumer /></AuthProvider>); });
    await act(async () => { screen.getByRole('button', { name: 'login' }).click(); });
    expect(i18n.changeLanguage).not.toHaveBeenCalled();
  });
});
