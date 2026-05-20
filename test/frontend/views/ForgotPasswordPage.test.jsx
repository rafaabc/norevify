import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ForgotPasswordPage from '@/views/ForgotPasswordPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/LoginPage.module.css', () => ({ default: {} }));
vi.mock('@/components/AuthBrandPanel.jsx', () => ({ default: () => <div data-testid="brand" /> }));

const mockForgotPassword = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: { forgotPassword: () => mockForgotPassword() },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockForgotPassword.mockResolvedValue({});
  });

  it('should render email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText('auth.forgotPassword.email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.forgotPassword.submit' })).toBeInTheDocument();
  });

  it('should show success message after successful submit', async () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('auth.forgotPassword.email'), { target: { value: 'user@example.com' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button').closest('form'));
    });
    expect(mockForgotPassword).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('auth.forgotPassword.success');
    expect(screen.queryByLabelText('auth.forgotPassword.email')).toBeNull();
  });

  it('should show error banner when forgotPassword throws', async () => {
    mockForgotPassword.mockRejectedValue(new Error('user not found'));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('auth.forgotPassword.email'), { target: { value: 'bad@example.com' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button').closest('form'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('user not found');
  });

  it('should render back to login link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: 'auth.forgotPassword.backToLogin' })).toBeInTheDocument();
  });
});
