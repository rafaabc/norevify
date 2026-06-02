import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChangePasswordPage from '@/views/ChangePasswordPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ username: 'testuser' }),
}));

const mockChangePassword = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: { changePassword: () => mockChangePassword() },
}));

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChangePassword.mockResolvedValue({});
  });

  it('should render heading and username', () => {
    render(<ChangePasswordPage />);
    expect(screen.getByText('auth.changePassword.heading')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should render all password fields', () => {
    render(<ChangePasswordPage />);
    expect(screen.getByLabelText('auth.changePassword.current')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.changePassword.new')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.changePassword.confirm')).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    render(<ChangePasswordPage />);
    fireEvent.change(screen.getByLabelText('auth.changePassword.new'), {
      target: { value: 'newpass1', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText('auth.changePassword.confirm'), {
      target: { value: 'newpass2', name: 'confirmPassword' },
    });
    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'auth.changePassword.submit' }).closest('form'),
      );
    });
    expect(screen.getByRole('alert')).toHaveTextContent('errors.passwordMismatch');
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('should call changePassword and show success on valid submit', async () => {
    render(<ChangePasswordPage />);
    fireEvent.change(screen.getByLabelText('auth.changePassword.current'), {
      target: { value: 'old', name: 'currentPassword' },
    });
    fireEvent.change(screen.getByLabelText('auth.changePassword.new'), {
      target: { value: 'newpass1', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText('auth.changePassword.confirm'), {
      target: { value: 'newpass1', name: 'confirmPassword' },
    });
    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'auth.changePassword.submit' }).closest('form'),
      );
    });
    expect(mockChangePassword).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('auth.changePassword.success');
  });

  it('should show error banner when changePassword throws', async () => {
    mockChangePassword.mockRejectedValue(new Error('wrong password'));
    render(<ChangePasswordPage />);
    fireEvent.change(screen.getByLabelText('auth.changePassword.new'), {
      target: { value: 'newpass1', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText('auth.changePassword.confirm'), {
      target: { value: 'newpass1', name: 'confirmPassword' },
    });
    await act(async () => {
      fireEvent.submit(
        screen.getByRole('button', { name: 'auth.changePassword.submit' }).closest('form'),
      );
    });
    expect(screen.getByRole('alert')).toHaveTextContent('wrong password');
  });
});
