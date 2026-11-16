import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LoginPage from '@/views/LoginPage.jsx';

const mockUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/login',
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockClearExpiredBanner = vi.fn();
let mockExpiredBanner = false;

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    expiredBanner: mockExpiredBanner,
    clearExpiredBanner: mockClearExpiredBanner,
  }),
}));

let googleButtonProps;
vi.mock('@/components/GoogleSignInButton.jsx', () => ({
  default: (props) => {
    googleButtonProps = props;
    return <div data-testid="google-btn" data-mode={props.mode} />;
  },
}));

vi.mock('@/components/AuthBrandPanel.jsx', () => ({
  default: () => <div data-testid="brand-panel" />,
}));

vi.mock('@/components/ErrorBanner.jsx', () => ({
  default: ({ message }) => <div data-testid="error-banner">{message}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockExpiredBanner = false;
  googleButtonProps = undefined;
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
});

describe('LoginPage', () => {
  it('should render the heading and the Google sign-in button in login mode', () => {
    render(<LoginPage />);
    expect(screen.getByText('auth.login.heading')).toBeInTheDocument();
    expect(screen.getByTestId('google-btn')).toHaveAttribute('data-mode', 'login');
  });

  it('should not render username/password inputs or a submit button', () => {
    render(<LoginPage />);
    expect(document.querySelector('input[name="username"]')).not.toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
    expect(document.querySelector('form')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not link to a password-recovery page', () => {
    render(<LoginPage />);
    expect(document.querySelector('a[href="/forgot-password"]')).not.toBeInTheDocument();
  });

  it('should link to the register page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'auth.login.register' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('should show the error reported by the Google button', async () => {
    render(<LoginPage />);
    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
    await act(async () => googleButtonProps.onError('errors.consentRequired'));
    expect(screen.getByTestId('error-banner')).toHaveTextContent('errors.consentRequired');
  });

  it.each([
    ['deleted=1', 'auth.login.accountDeleted'],
    ['loggedOut=1', 'auth.login.loggedOut'],
  ])('should show banner for query param %s', (param, expectedKey) => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(param));
    render(<LoginPage />);
    expect(screen.getByTestId('error-banner')).toHaveTextContent(expectedKey);
  });

  it.each(['registered=1', 'passwordChanged=1'])(
    'should ignore the retired query param %s',
    (param) => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams(param));
      render(<LoginPage />);
      expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
    },
  );

  it('should show session expired banner when expiredBanner is true', () => {
    mockExpiredBanner = true;
    render(<LoginPage />);
    expect(screen.getByTestId('error-banner')).toHaveTextContent('auth.login.sessionExpired');
  });
});
