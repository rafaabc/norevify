import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RegisterPage from '@/views/RegisterPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/LoginPage.module.css', () => ({ default: {} }));
vi.mock('@/components/AuthBrandPanel.jsx', () => ({ default: () => <div data-testid="brand" /> }));
vi.mock('@/components/GoogleSignInButton.jsx', () => ({
  default: () => <div data-testid="google-btn" />,
}));
vi.mock('@/utils/detectCurrency.js', () => ({ detectCurrency: () => 'BRL' }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => mockUseRouter() }));

const mockRegister = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: { register: () => mockRegister() },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockRegister.mockResolvedValue({});
  });

  it('should render heading', () => {
    render(<RegisterPage />);
    expect(screen.getByText('auth.register.heading')).toBeInTheDocument();
  });

  it('should render username, email, password, currency fields', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('auth.register.username')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.password')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.currency')).toBeInTheDocument();
  });

  it('should navigate to /login?registered=1 on success', async () => {
    render(<RegisterPage />);
    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'auth.register.submit' }).closest('form'),
      );
    });
    expect(mockPush).toHaveBeenCalledWith('/login?registered=1');
  });

  it('should show error banner on register failure', async () => {
    mockRegister.mockRejectedValue(new Error('username taken'));
    render(<RegisterPage />);
    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'auth.register.submit' }).closest('form'),
      );
    });
    expect(screen.getByRole('alert')).toHaveTextContent('username taken');
  });

  it('should render Google sign-in button', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('google-btn')).toBeInTheDocument();
  });

  it('should render sign in link', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: 'auth.register.signIn' })).toBeInTheDocument();
  });

  it('should render consent checkbox unchecked', () => {
    render(<RegisterPage />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should disable submit button when consent not checked', () => {
    render(<RegisterPage />);
    const submit = screen.getByRole('button', { name: 'auth.register.submit' });
    expect(submit).toBeDisabled();
  });

  it('should enable submit button after consent checked', () => {
    render(<RegisterPage />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const submit = screen.getByRole('button', { name: 'auth.register.submit' });
    expect(submit).not.toBeDisabled();
  });
});
