import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../../src/pages/ResetPasswordPage.jsx';
import { authApi } from '../../src/services/apiService.js';

jest.mock('../../src/services/apiService.js', () => ({
  authApi: { resetPassword: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderWithToken(token = 'valid.test.token') {
  const path = token ? `/reset-password?token=${token}` : '/reset-password';
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }} initialEntries={[path]}>
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render newPassword and confirmPassword fields when token is present', () => {
    const { container } = renderWithToken();
    expect(container.querySelector('input[name="newPassword"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.resetPassword.submit' })).toBeInTheDocument();
  });

  test('should redirect to /forgot-password when no token is in URL', () => {
    renderWithToken(null);
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password', { replace: true });
  });

  test('should show error and not call API when passwords do not match', async () => {
    authApi.resetPassword.mockResolvedValue({});
    const { container } = renderWithToken();

    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'different' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('errors.passwordMismatch');
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  test('should call authApi.resetPassword with token and newPassword', async () => {
    authApi.resetPassword.mockResolvedValue({});
    const { container } = renderWithToken('abc.def.ghi');

    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith({ token: 'abc.def.ghi', newPassword: 'newPass99' });
    });
  });

  test('should navigate to /login with passwordChanged state on success', async () => {
    authApi.resetPassword.mockResolvedValue({});
    const { container } = renderWithToken();

    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { passwordChanged: true } });
    });
  });

  test('should show error banner when API call fails', async () => {
    authApi.resetPassword.mockRejectedValue(new Error('Invalid or expired reset token'));
    const { container } = renderWithToken();

    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('Invalid or expired reset token');
  });

  test('should show loading text on submit button while request is in flight', async () => {
    let resolve;
    authApi.resetPassword.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { container } = renderWithToken();

    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByRole('button', { name: 'auth.resetPassword.submitting' })).toBeInTheDocument();
    resolve({});
  });
});
