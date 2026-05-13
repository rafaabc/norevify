import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChangePasswordPage from '../../src/pages/ChangePasswordPage.jsx';
import { authApi } from '../../src/services/apiService.js';

jest.mock('../../src/services/apiService.js', () => ({
  authApi: { changePassword: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderPage() {
  return render(<MemoryRouter future={{ v7_relativeSplatPath: true }}><ChangePasswordPage /></MemoryRouter>);
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render username, newPassword, confirmPassword fields and submit button', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[name="username"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="newPassword"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change password/i })).toBeInTheDocument();
  });

  test('should show inline error and not call API when passwords do not match', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'abc123456' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'different' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('Passwords do not match.');
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  test('should call authApi.changePassword with correct payload on valid submit', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({ username: 'alice', newPassword: 'newPass99' });
    });
  });

  test('should navigate to /login with passwordChanged state on success', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'alice' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { passwordChanged: true } });
    });
  });

  test('should render ErrorBanner when API call fails', async () => {
    authApi.changePassword.mockRejectedValue(new Error('User not found'));
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'nobody' } });
    fireEvent.change(container.querySelector('input[name="newPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { value: 'newPass99' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('User not found');
  });
});
