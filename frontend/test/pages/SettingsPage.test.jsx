import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../../src/pages/SettingsPage.jsx';

const mockUpdateCurrency = jest.fn();
const mockUpdateLanguage = jest.fn();

jest.mock('../../src/services/apiService.js', () => ({
  authApi: {
    getProviders: jest.fn().mockResolvedValue({ authProviders: [], hasPassword: false }),
    updateCurrency: jest.fn().mockResolvedValue({ token: 'tok' }),
    updateLanguage: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

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
      language: 'en',
      updateLanguage: mockUpdateLanguage,
    });
  });

  test('should render currency select pre-filled with current currency', () => {
    renderPage();
    const select = screen.getByRole('combobox', { name: 'settings.currency.label' });
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('BRL');
  });

  test('should render language select pre-filled with current language', () => {
    renderPage();
    const select = screen.getByRole('combobox', { name: /language/i });
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('en');
  });

  test('should show the logged-in username', () => {
    renderPage();
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
  });

  test('should disable currency Save button when selection matches current currency', () => {
    renderPage();
    const currencySelect = screen.getByRole('combobox', { name: 'settings.currency.label' });
    const form = currencySelect.closest('form');
    expect(form.querySelector('button[type="submit"]')).toBeDisabled();
  });

  test('should enable currency Save button when a different currency is selected', () => {
    renderPage();
    fireEvent.change(screen.getByRole('combobox', { name: 'settings.currency.label' }), {
      target: { value: 'DKK' },
    });
    const currencySelect = screen.getByRole('combobox', { name: 'settings.currency.label' });
    const form = currencySelect.closest('form');
    expect(form.querySelector('button[type="submit"]')).not.toBeDisabled();
  });

  test('should call updateCurrency and show success message on submit', async () => {
    mockUpdateCurrency.mockResolvedValue();
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: 'settings.currency.label' }), {
      target: { value: 'USD' },
    });
    const currencySelect = screen.getByRole('combobox', { name: 'settings.currency.label' });
    const form = currencySelect.closest('form');
    await act(async () => {
      fireEvent.click(form.querySelector('button[type="submit"]'));
    });

    await waitFor(() => {
      expect(mockUpdateCurrency).toHaveBeenCalledWith('USD');
      expect(screen.getByText('settings.currency.success')).toBeInTheDocument();
    });
  });

  test('should show error banner when updateCurrency rejects', async () => {
    mockUpdateCurrency.mockRejectedValue(new Error('Network error'));
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: 'settings.currency.label' }), {
      target: { value: 'EUR' },
    });
    const currencySelect = screen.getByRole('combobox', { name: 'settings.currency.label' });
    const form = currencySelect.closest('form');
    await act(async () => {
      fireEvent.click(form.querySelector('button[type="submit"]'));
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('should show loading text on currency Save button while request is in flight', async () => {
    let resolve;
    mockUpdateCurrency.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: 'settings.currency.label' }), {
      target: { value: 'GBP' },
    });
    const currencySelect = screen.getByRole('combobox', { name: 'settings.currency.label' });
    const form = currencySelect.closest('form');
    fireEvent.click(form.querySelector('button[type="submit"]'));

    expect(form.querySelector('button[type="submit"]').textContent).toBe('common.saving');
    resolve();
  });

  test('should call updateLanguage and show success message on submit', async () => {
    mockUpdateLanguage.mockResolvedValue();
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: /language/i }), {
      target: { value: 'pt-BR' },
    });
    const langSelect = screen.getByRole('combobox', { name: /language/i });
    const form = langSelect.closest('form');
    await act(async () => {
      fireEvent.click(form.querySelector('button[type="submit"]'));
    });

    await waitFor(() => {
      expect(mockUpdateLanguage).toHaveBeenCalledWith('pt-BR');
      expect(screen.getByText('settings.language.success')).toBeInTheDocument();
    });
  });

  test('should show error banner when updateLanguage rejects', async () => {
    mockUpdateLanguage.mockRejectedValue(new Error('Lang error'));
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: /language/i }), {
      target: { value: 'pt-BR' },
    });
    const langSelect = screen.getByRole('combobox', { name: /language/i });
    const form = langSelect.closest('form');
    await act(async () => {
      fireEvent.click(form.querySelector('button[type="submit"]'));
    });

    await waitFor(() => {
      expect(screen.getByText('Lang error')).toBeInTheDocument();
    });
  });

  test('should disable language select and save button while updateLanguage is pending', async () => {
    mockUpdateLanguage.mockImplementation(() => new Promise(() => {}));
    renderPage();

    fireEvent.change(screen.getByRole('combobox', { name: /language/i }), {
      target: { value: 'pt-BR' },
    });
    const langSelect = screen.getByRole('combobox', { name: /language/i });
    const form = langSelect.closest('form');
    fireEvent.click(form.querySelector('button[type="submit"]'));

    expect(langSelect).toBeDisabled();
    expect(form.querySelector('button[type="submit"]')).toBeDisabled();
  });

  test('should render a Change password link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'settings.changePassword' })).toHaveAttribute('href', '/change-password');
  });
});
