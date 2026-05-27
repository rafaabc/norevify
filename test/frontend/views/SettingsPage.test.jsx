import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SettingsPage from '@/views/SettingsPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/SettingsPage.module.css', () => ({ default: {} }));
vi.mock('@/components/GoogleSignInButton.jsx', () => ({ default: ({ onSuccess }) => <button onClick={onSuccess}>google-link</button> }));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const mockUpdateCurrency = vi.fn();
const mockUpdateLanguage = vi.fn();
let mockAuthState = { username: 'alice', currency: 'BRL', language: 'en', updateCurrency: null, updateLanguage: null };
let mockEmailVerified = true;
const mockLogout = vi.fn();

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    ...mockAuthState,
    updateCurrency: mockUpdateCurrency,
    updateLanguage: mockUpdateLanguage,
    logout: mockLogout,
    login: vi.fn(),
    emailVerified: mockEmailVerified,
  }),
}));

const mockGetProviders = vi.fn();
const mockUnlinkGoogle = vi.fn();
const mockUpdateOdometer = vi.fn();
const mockExportData = vi.fn();
const mockDeleteAccount = vi.fn();
const mockResendVerification = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: {
    getProviders: () => mockGetProviders(),
    unlinkGoogle: () => mockUnlinkGoogle(),
    updateOdometer: () => mockUpdateOdometer(),
    exportData: () => mockExportData(),
    deleteAccount: (...args) => mockDeleteAccount(...args),
    resendVerification: () => mockResendVerification(),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailVerified = true;
    mockUpdateCurrency.mockResolvedValue({});
    mockUpdateLanguage.mockResolvedValue({});
    mockUnlinkGoogle.mockResolvedValue({});
    mockUpdateOdometer.mockResolvedValue({});
    mockGetProviders.mockResolvedValue({ authProviders: ['google'], hasPassword: true });
    mockExportData.mockResolvedValue({ user: {}, expenses: [] });
    mockDeleteAccount.mockResolvedValue({});
    mockResendVerification.mockResolvedValue({});
  });

  it('should render heading and username', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByText('settings.heading')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('should render currency select', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByLabelText('settings.currency.label')).toBeInTheDocument();
  });

  it('should call updateCurrency on currency form submit', async () => {
    await act(async () => { render(<SettingsPage />); });
    const select = screen.getByLabelText('settings.currency.label');
    fireEvent.change(select, { target: { value: 'USD' } });
    const forms = document.querySelectorAll('form');
    await act(async () => { fireEvent.submit(forms[0]); });
    expect(mockUpdateCurrency).toHaveBeenCalledWith('USD');
  });

  it('should call updateLanguage on language form submit', async () => {
    await act(async () => { render(<SettingsPage />); });
    const select = screen.getByLabelText('settings.language.label');
    fireEvent.change(select, { target: { value: 'pt-BR' } });
    const forms = document.querySelectorAll('form');
    await act(async () => { fireEvent.submit(forms[1]); });
    expect(mockUpdateLanguage).toHaveBeenCalledWith('pt-BR');
  });

  it('should call updateOdometer on odo form submit', async () => {
    await act(async () => { render(<SettingsPage />); });
    fireEvent.change(screen.getByLabelText('vehicle.currentKm'), { target: { value: '15000' } });
    const forms = document.querySelectorAll('form');
    await act(async () => { fireEvent.submit(forms[2]); });
    expect(mockUpdateOdometer).toHaveBeenCalledOnce();
  });

  it('should show disconnect button when google is linked', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByText('settings.disconnectGoogle')).toBeInTheDocument();
  });

  it('should call unlinkGoogle and update providers on disconnect', async () => {
    await act(async () => { render(<SettingsPage />); });
    await act(async () => { fireEvent.click(screen.getByText('settings.disconnectGoogle')); });
    expect(mockUnlinkGoogle).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('settings.googleDisconnected');
  });

  it('should show google link button when google is not linked', async () => {
    mockGetProviders.mockResolvedValue({ authProviders: [], hasPassword: true });
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByText('google-link')).toBeInTheDocument();
  });

  it('should render change-password link', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByRole('link', { name: /settings\.changePassword/ })).toHaveAttribute('href', '/change-password');
  });

  it('should render export data button', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByRole('button', { name: 'settings.myData.export' })).toBeInTheDocument();
  });

  it('should render delete account button', async () => {
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByRole('button', { name: 'settings.myData.deleteAccount' })).toBeInTheDocument();
  });

  it('should show delete modal when delete account button is clicked', async () => {
    await act(async () => { render(<SettingsPage />); });
    const deleteBtn = screen.getByRole('button', { name: 'settings.myData.deleteAccount' });
    await act(async () => { fireEvent.click(deleteBtn); });
    expect(screen.getByText('settings.deleteAccount.heading')).toBeInTheDocument();
  });

  it('should show error banner when unlinkGoogle fails', async () => {
    mockUnlinkGoogle.mockRejectedValue(new Error('unlink failed'));
    await act(async () => { render(<SettingsPage />); });
    await act(async () => { fireEvent.click(screen.getByText('settings.disconnectGoogle')); });
    expect(screen.getByRole('alert')).toHaveTextContent('unlink failed');
  });

  it('should trigger file download on export data', async () => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.export' }));
    });

    expect(mockExportData).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should show export error when exportData fails', async () => {
    mockExportData.mockRejectedValue(new Error('export error'));
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.export' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('export error');
  });

  it('should call deleteAccount, logout and redirect on confirmed delete', async () => {
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.deleteAccount' }));
    });
    const passwordInput = screen.getByLabelText('settings.deleteAccount.passwordLabel');
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.deleteAccount.confirm' }));
    });
    expect(mockDeleteAccount).toHaveBeenCalledWith({ password: 'secret' });
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login?deleted=1');
  });

  it('should show delete error when deleteAccount fails', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('delete failed'));
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.deleteAccount' }));
    });
    const passwordInput = screen.getByLabelText('settings.deleteAccount.passwordLabel');
    fireEvent.change(passwordInput, { target: { value: 'bad' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.deleteAccount.confirm' }));
    });
    expect(screen.getByText('delete failed')).toBeInTheDocument();
  });

  it('should show resend verification button when emailVerified is false', async () => {
    mockEmailVerified = false;
    await act(async () => { render(<SettingsPage />); });
    expect(screen.getByRole('button', { name: 'auth.verifyEmail.resend' })).toBeInTheDocument();
  });

  it('should call resendVerification when resend button is clicked', async () => {
    mockEmailVerified = false;
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'auth.verifyEmail.resend' }));
    });
    expect(mockResendVerification).toHaveBeenCalled();
  });

  it('should show resend success banner after successful resend', async () => {
    mockEmailVerified = false;
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'auth.verifyEmail.resend' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('auth.verifyEmail.resendSuccess');
  });

  it('should close delete modal when cancel button is clicked', async () => {
    await act(async () => { render(<SettingsPage />); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.deleteAccount' }));
    });
    expect(screen.getByText('settings.deleteAccount.heading')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    });
    expect(screen.queryByText('settings.deleteAccount.heading')).not.toBeInTheDocument();
  });
});
