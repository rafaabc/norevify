import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../../src/pages/SettingsPage.jsx';

const mockUpdateCurrency = jest.fn();

jest.mock('../../src/context/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../src/context/AuthContext.jsx';

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }}>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      username: 'testuser',
      currency: 'BRL',
      updateCurrency: mockUpdateCurrency,
    });
  });

  test('should render currency select pre-filled with current currency', () => {
    renderPage();
    const select = screen.getByRole('combobox', { name: /preferred currency/i });
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('BRL');
  });

  test('should show the logged-in username', () => {
    renderPage();
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
  });

  test('should disable Save button when selection matches current currency', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  test('should enable Save button when a different currency is selected', () => {
    renderPage();
    fireEvent.change(screen.getByRole('combobox', { name: /preferred currency/i }), {
      target: { value: 'DKK' },
    });
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  test('should call updateCurrency and show success message on submit', async () => {
    mockUpdateCurrency.mockResolvedValue();
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: /preferred currency/i }), {
      target: { value: 'USD' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
    });

    await waitFor(() => {
      expect(mockUpdateCurrency).toHaveBeenCalledWith('USD');
      expect(screen.getByText(/currency updated successfully/i)).toBeInTheDocument();
    });
  });

  test('should show error banner when updateCurrency rejects', async () => {
    mockUpdateCurrency.mockRejectedValue(new Error('Network error'));
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: /preferred currency/i }), {
      target: { value: 'EUR' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('should show loading text while request is in flight', async () => {
    let resolve;
    mockUpdateCurrency.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: /preferred currency/i }), {
      target: { value: 'GBP' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    resolve();
  });

  test('should render a Change password link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /change password/i })).toHaveAttribute('href', '/change-password');
  });
});
