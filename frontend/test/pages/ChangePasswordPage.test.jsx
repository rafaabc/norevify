import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChangePasswordPage from '../../src/pages/ChangePasswordPage.jsx';
import { authApi } from '../../src/services/apiService.js';
import { useAuth } from '../../src/context/AuthContext.jsx';

jest.mock('../../src/services/apiService.js', () => ({
  authApi: { changePassword: jest.fn() },
}));
jest.mock('../../src/context/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

function renderPage() {
  useAuth.mockReturnValue({ username: 'testuser' });
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }}>
      <ChangePasswordPage />
    </MemoryRouter>
  );
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render currentPassword, newPassword, confirmPassword fields and submit button', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[name="currentPassword"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="newPassword"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.changePassword.submit' })).toBeInTheDocument();
  });

  test('should display the logged-in username', () => {
    renderPage();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('should show inline error and not call API when passwords do not match', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="currentPassword"]'), { target: { value: 'password1' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'abc123456' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'different' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('errors.passwordMismatch');
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  test('should call authApi.changePassword without username in payload', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="currentPassword"]'), { target: { value: 'password1' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'password1', newPassword: 'newPass99' });
    });
  });

  test('should show success banner and clear form on success', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="currentPassword"]'), { target: { value: 'password1' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('auth.changePassword.success');
    expect(container.querySelector('input[name="currentPassword"]').value).toBe('');
  });

  test('should render ErrorBanner when API call fails', async () => {
    authApi.changePassword.mockRejectedValue(new Error('Invalid credentials'));
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="currentPassword"]'), { target: { value: 'wrongpass1' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('Invalid credentials');
  });
});
