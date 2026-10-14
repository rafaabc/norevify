import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/i18n/index.js', () => ({
  default: { t: (k) => k, changeLanguage: vi.fn(), language: 'en' },
}));

const login = vi.fn();
vi.mock('@/context/AuthContext.jsx', () => ({ useAuth: () => ({ login }) }));

const googleLogin = vi.fn();
const linkGoogle = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: {
    googleLogin: (...args) => googleLogin(...args),
    linkGoogle: (...args) => linkGoogle(...args),
  },
}));

let gisCallback;

async function renderButton(props = {}) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');
  const { default: GoogleSignInButton } = await import('@/components/GoogleSignInButton.jsx');
  render(<GoogleSignInButton mode="login" {...props} />);
  await waitFor(() => expect(gisCallback).toBeTypeOf('function'));
}

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gisCallback = undefined;
    globalThis.google = {
      accounts: {
        id: {
          initialize: vi.fn(({ callback }) => {
            gisCallback = callback;
          }),
          renderButton: vi.fn(),
          prompt: vi.fn(),
        },
      },
    };
  });

  it('should show a status message while the login request is pending', async () => {
    googleLogin.mockReturnValue(new Promise(() => {}));
    await renderButton();

    expect(screen.queryByRole('status')).toBeNull();
    act(() => {
      gisCallback({ credential: 'x' });
    });

    expect((await screen.findByRole('status')).textContent).toBe('auth.login.submitting');
  });

  it('should clear the status and call onError when login fails', async () => {
    googleLogin.mockRejectedValue(new Error('Invalid Google token'));
    const onError = vi.fn();
    await renderButton({ onError });

    await act(async () => {
      await gisCallback({ credential: 'x' });
    });

    expect(onError).toHaveBeenCalledWith('Invalid Google token');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('should ignore a second credential while one is in flight', async () => {
    googleLogin.mockReturnValue(new Promise(() => {}));
    await renderButton();

    act(() => {
      gisCallback({ credential: 'x' });
      gisCallback({ credential: 'y' });
    });

    expect(googleLogin).toHaveBeenCalledTimes(1);
  });
});
