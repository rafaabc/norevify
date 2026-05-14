import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../../src/pages/ForgotPasswordPage.jsx';
import { authApi } from '../../src/services/apiService.js';

jest.mock('../../src/services/apiService.js', () => ({
  authApi: { forgotPassword: jest.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }}>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render email input and submit button', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  test('should show success message after submit regardless of email existence', async () => {
    authApi.forgotPassword.mockResolvedValue({ message: 'If the email exists, a reset link was sent.' });
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'user@example.com' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText(/registered.*link/i);
    expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  test('should hide form and show back link after successful submit', async () => {
    authApi.forgotPassword.mockResolvedValue({});
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'user@example.com' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(container.querySelector('form')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  test('should show error banner when API call fails', async () => {
    authApi.forgotPassword.mockRejectedValue(new Error('Server error'));
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'user@example.com' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('Server error');
  });

  test('should show loading text on submit button while request is in flight', async () => {
    let resolve;
    authApi.forgotPassword.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { container } = renderPage();

    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'user@example.com' } });
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
    resolve({});
  });
});
