import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/views/LoginPage.jsx';

let mockPush;
const mockUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/login',
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('@/services/apiService.js', () => ({
  authApi: { login: vi.fn() },
}));

const mockLogin = vi.fn();
const mockClearExpiredBanner = vi.fn();
let mockExpiredBanner = false;

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    login: mockLogin,
    expiredBanner: mockExpiredBanner,
    clearExpiredBanner: mockClearExpiredBanner,
  }),
}));

vi.mock('@/components/GoogleSignInButton.jsx', () => ({
  default: () => <div data-testid="google-btn" />,
}));

vi.mock('@/components/AuthBrandPanel.jsx', () => ({
  default: () => <div data-testid="brand-panel" />,
}));

vi.mock('@/components/ErrorBanner.jsx', () => ({
  default: ({ message }) => <div data-testid="error-banner">{message}</div>,
}));

import { authApi } from '@/services/apiService.js';

beforeEach(() => {
  mockPush = vi.fn();
  mockExpiredBanner = false;
  vi.clearAllMocks();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
});

describe('LoginPage', () => {
  it('should render username and password inputs', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/auth\.login\.usernameLabel/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('should render a submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /auth\.login\.submit/i })).toBeInTheDocument();
  });

  it('should call authApi.login with form values on submit', async () => {
    authApi.login.mockResolvedValue({ token: 'tok' });
    render(<LoginPage />);
    fireEvent.change(document.querySelector('input[name="username"]'), {
      target: { name: 'username', value: 'alice' },
    });
    fireEvent.change(document.querySelector('input[name="password"]'), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({ username: 'alice', password: 'pass' }),
    );
  });

  it('should show error message when login fails', async () => {
    authApi.login.mockRejectedValue(new Error('errors.invalidCredentials'));
    render(<LoginPage />);
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() =>
      expect(screen.getByTestId('error-banner')).toHaveTextContent('errors.invalidCredentials'),
    );
  });

  it('should call login context function and redirect on successful login', async () => {
    authApi.login.mockResolvedValue({ token: 'tok' });
    render(<LoginPage />);
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('tok'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it.each([
    ['deleted=1', 'auth.login.accountDeleted'],
    ['registered=1', 'auth.login.accountCreated'],
    ['loggedOut=1', 'auth.login.loggedOut'],
    ['passwordChanged=1', 'auth.login.passwordChanged'],
  ])('should show banner for query param %s', (param, expectedKey) => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(param));
    render(<LoginPage />);
    expect(screen.getByTestId('error-banner')).toHaveTextContent(expectedKey);
  });

  it('should show session expired banner when expiredBanner is true', () => {
    mockExpiredBanner = true;
    render(<LoginPage />);
    expect(screen.getByTestId('error-banner')).toHaveTextContent('auth.login.sessionExpired');
  });
});
