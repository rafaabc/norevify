import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SettingsPage from '@/views/SettingsPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));
vi.mock('@/views/SettingsPage.module.css', () => ({ default: {} }));
let reauthProps;
vi.mock('@/components/GoogleSignInButton.jsx', () => ({
  default: (props) => {
    reauthProps = props;
    return <div data-testid="reauth-btn" data-mode={props.mode} />;
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUpdateCurrency = vi.fn();
const mockUpdateLanguage = vi.fn();
let mockAuthState = {
  username: 'alice',
  currency: 'BRL',
  language: 'en',
  updateCurrency: null,
  updateLanguage: null,
};
const mockLogout = vi.fn();

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    ...mockAuthState,
    updateCurrency: mockUpdateCurrency,
    updateLanguage: mockUpdateLanguage,
    logout: mockLogout,
    login: vi.fn(),
  }),
}));

const mockLogoutAll = vi.fn();
const mockExportData = vi.fn();
const mockDeleteAccount = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  authApi: {
    logoutAll: () => mockLogoutAll(),
    exportData: () => mockExportData(),
    deleteAccount: (...args) => mockDeleteAccount(...args),
  },
}));

describe('SettingsPage', () => {
  const renderPage = () =>
    act(async () => {
      render(<SettingsPage />);
    });
  const openDeleteModal = async () => {
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.deleteAccount' }));
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reauthProps = undefined;
    mockUpdateCurrency.mockResolvedValue({});
    mockUpdateLanguage.mockResolvedValue({});
    mockLogoutAll.mockResolvedValue({});
    mockExportData.mockResolvedValue({ user: {}, expenses: [] });
    mockDeleteAccount.mockResolvedValue({});
  });

  it('should render heading and username', async () => {
    await renderPage();
    expect(screen.getByText('settings.heading')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('should render currency select', async () => {
    await renderPage();
    expect(screen.getByLabelText('settings.currency.label')).toBeInTheDocument();
  });

  it('should call updateCurrency on currency form submit', async () => {
    await renderPage();
    const select = screen.getByLabelText('settings.currency.label');
    fireEvent.change(select, { target: { value: 'USD' } });
    const forms = document.querySelectorAll('form');
    await act(async () => {
      fireEvent.submit(forms[0]);
    });
    expect(mockUpdateCurrency).toHaveBeenCalledWith('USD');
  });

  it('should call updateLanguage on language form submit', async () => {
    await renderPage();
    const select = screen.getByLabelText('settings.language.label');
    fireEvent.change(select, { target: { value: 'pt-BR' } });
    const forms = document.querySelectorAll('form');
    await act(async () => {
      fireEvent.submit(forms[1]);
    });
    expect(mockUpdateLanguage).toHaveBeenCalledWith('pt-BR');
  });

  it('should render export data button', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: 'settings.myData.export' })).toBeInTheDocument();
  });

  it('should render delete account button', async () => {
    await renderPage();
    expect(
      screen.getByRole('button', { name: 'settings.myData.deleteAccount' }),
    ).toBeInTheDocument();
  });

  it('should show delete modal when delete account button is clicked', async () => {
    await openDeleteModal();
    expect(screen.getByText('settings.deleteAccount.heading')).toBeInTheDocument();
  });

  it('should trigger file download on export data', async () => {
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    globalThis.URL.revokeObjectURL = vi.fn();

    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.export' }));
    });

    expect(mockExportData).toHaveBeenCalled();
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should show export error when exportData fails', async () => {
    mockExportData.mockRejectedValue(new Error('export error'));
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.myData.export' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('export error');
  });

  it('should not offer a password field or a link to change the password', async () => {
    await openDeleteModal();
    expect(screen.queryByRole('link', { name: /settings\.changePassword/ })).toBeNull();
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
  });

  it('should ask for Google re-authentication inside the delete modal', async () => {
    await openDeleteModal();
    expect(screen.getByTestId('reauth-btn')).toHaveAttribute('data-mode', 'reauth');
  });

  it('should call deleteAccount with the fresh idToken, logout and redirect', async () => {
    await openDeleteModal();
    await act(async () => reauthProps.onCredential('fresh-id-token'));
    expect(mockDeleteAccount).toHaveBeenCalledWith({ idToken: 'fresh-id-token' });
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login?deleted=1');
  });

  it('should show delete error and stay signed in when deleteAccount fails', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('delete failed'));
    await openDeleteModal();
    await act(async () => reauthProps.onCredential('bad-token'));
    expect(screen.getByText('delete failed')).toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('should show the error reported by the re-authentication step', async () => {
    await openDeleteModal();
    await act(async () => reauthProps.onError('reauth failed'));
    expect(screen.getByText('reauth failed')).toBeInTheDocument();
  });

  it('should sign out of all devices, then logout locally and redirect', async () => {
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.sessions.signOutEverywhere' }));
    });
    expect(mockLogoutAll).toHaveBeenCalledOnce();
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login?loggedOut=1');
  });

  it('should show an error and stay signed in when sign-out-everywhere fails', async () => {
    mockLogoutAll.mockRejectedValue(new Error('logout-all failed'));
    await renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'settings.sessions.signOutEverywhere' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('logout-all failed');
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('should close delete modal when cancel button is clicked', async () => {
    await openDeleteModal();
    expect(screen.getByText('settings.deleteAccount.heading')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    });
    expect(screen.queryByText('settings.deleteAccount.heading')).not.toBeInTheDocument();
  });
});
