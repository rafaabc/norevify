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

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    ...mockAuthState,
    updateCurrency: mockUpdateCurrency,
    updateLanguage: mockUpdateLanguage,
    logout: vi.fn(),
    login: vi.fn(),
    emailVerified: true,
  }),
}));

const mockGetProviders = vi.fn();
const mockUnlinkGoogle = vi.fn();
const mockUpdateOdometer = vi.fn();
const mockExportData = vi.fn();
const mockDeleteAccount = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: {
    getProviders: () => mockGetProviders(),
    unlinkGoogle: () => mockUnlinkGoogle(),
    updateOdometer: () => mockUpdateOdometer(),
    exportData: () => mockExportData(),
    deleteAccount: (...args) => mockDeleteAccount(...args),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateCurrency.mockResolvedValue({});
    mockUpdateLanguage.mockResolvedValue({});
    mockUnlinkGoogle.mockResolvedValue({});
    mockUpdateOdometer.mockResolvedValue({});
    mockGetProviders.mockResolvedValue({ authProviders: ['google'], hasPassword: true });
    mockExportData.mockResolvedValue({ user: {}, expenses: [] });
    mockDeleteAccount.mockResolvedValue({});
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
});
