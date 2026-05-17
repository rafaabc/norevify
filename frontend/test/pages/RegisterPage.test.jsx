import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../../src/pages/RegisterPage.jsx';
import { authApi } from '../../src/services/apiService.js';

jest.mock('../../src/services/apiService.js', () => ({
  authApi: { register: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderRegisterPage() {
  return render(<MemoryRouter future={{ v7_relativeSplatPath: true }}><RegisterPage /></MemoryRouter>);
}

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render username, email, password fields and submit button', () => {
    const { container } = renderRegisterPage();
    expect(container.querySelector('input[name="username"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.register.submit' })).toBeInTheDocument();
  });

  test('should call authApi.register with username, email and password and navigate to /login on success', async () => {
    authApi.register.mockResolvedValue({});
    const { container } = renderRegisterPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'newuser' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'newuser@example.com' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'password123' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({ username: 'newuser', email: 'newuser@example.com', password: 'password123' }));
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { justRegistered: true } });
    });
  });

  test('should display error message when registration fails', async () => {
    authApi.register.mockRejectedValue(new Error('Username already taken'));
    const { container } = renderRegisterPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'existinguser' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'existing@example.com' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'password123' } });
    fireEvent.submit(container.querySelector('form'));

    await screen.findByText('Username already taken');
  });

  test('should show loading text on the submit button while request is in flight', async () => {
    let resolveRegister;
    authApi.register.mockReturnValue(new Promise((r) => { resolveRegister = r; }));
    const { container } = renderRegisterPage();

    fireEvent.change(container.querySelector('input[name="username"]'), { target: { value: 'user' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { value: 'user@example.com' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { value: 'pass1234' } });
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByRole('button', { name: 'auth.register.submitting' })).toBeInTheDocument();
    resolveRegister({});
  });

  test('should have correct HTML5 validation attributes on username input', () => {
    const { container } = renderRegisterPage();
    const usernameInput = container.querySelector('input[name="username"]');
    expect(usernameInput).toHaveAttribute('minLength', '3');
    expect(usernameInput).toHaveAttribute('maxLength', '50');
    expect(usernameInput).toHaveAttribute('pattern', '[a-zA-Z0-9_]+');
  });

  test('should have type="email" on the email input', () => {
    const { container } = renderRegisterPage();
    expect(container.querySelector('input[name="email"]')).toHaveAttribute('type', 'email');
  });
});
