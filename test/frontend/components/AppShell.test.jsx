import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import AppShell from '@/components/AppShell';

vi.mock('@/components/Sidebar.jsx', () => ({ default: ({ badgeCount }) => <div data-testid="sidebar" data-badge={badgeCount} /> }));
vi.mock('@/components/MobileTopBar.jsx', () => ({ default: ({ badgeCount }) => <div data-testid="mobile-top-bar" data-badge={badgeCount} /> }));
vi.mock('@/components/BottomTabs.jsx', () => ({ default: () => <div data-testid="bottom-tabs" /> }));
vi.mock('@/components/AppShell.module.css', () => ({ default: {} }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

const mockBadgeCount = vi.fn();
const mockResendVerification = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  remindersApi: { badgeCount: () => mockBadgeCount() },
  authApi: { resendVerification: () => mockResendVerification() },
}));

let mockIsAuthed = true;
let mockEmailVerified = null;
vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ isAuthed: mockIsAuthed, emailVerified: mockEmailVerified }),
}));

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthed = true;
    mockEmailVerified = null;
    mockBadgeCount.mockResolvedValue({ dueSoon: 2, overdue: 1 });
    mockResendVerification.mockResolvedValue({});
  });

  it('should render sidebar, top bar, bottom tabs and children', async () => {
    await act(async () => {
      render(<AppShell><span>child</span></AppShell>);
    });
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-tabs')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('should pass badge count to sidebar and mobile top bar', async () => {
    await act(async () => {
      render(<AppShell><span>child</span></AppShell>);
    });
    expect(screen.getByTestId('sidebar').dataset.badge).toBe('3');
    expect(screen.getByTestId('mobile-top-bar').dataset.badge).toBe('3');
  });

  it('should set badge to 0 when not authed', async () => {
    mockIsAuthed = false;
    await act(async () => {
      render(<AppShell><span>x</span></AppShell>);
    });
    expect(screen.getByTestId('sidebar').dataset.badge).toBe('0');
  });

  it('should silently ignore badge fetch errors', async () => {
    mockBadgeCount.mockRejectedValue(new Error('network error'));
    await act(async () => {
      render(<AppShell><span>x</span></AppShell>);
    });
    expect(screen.getByTestId('sidebar').dataset.badge).toBe('0');
  });

  it('should not show email verification banner when emailVerified is true', async () => {
    mockEmailVerified = true;
    await act(async () => { render(<AppShell><span>x</span></AppShell>); });
    expect(screen.queryByText('auth.verifyEmail.bannerText')).not.toBeInTheDocument();
  });

  it('should show email verification banner when emailVerified is false', async () => {
    mockEmailVerified = false;
    await act(async () => { render(<AppShell><span>x</span></AppShell>); });
    expect(screen.getByText('auth.verifyEmail.bannerText')).toBeInTheDocument();
  });

  it('should show resend button in banner and call resendVerification on click', async () => {
    mockEmailVerified = false;
    await act(async () => { render(<AppShell><span>x</span></AppShell>); });
    const resendBtn = screen.getByRole('button', { name: 'auth.verifyEmail.bannerAction' });
    expect(resendBtn).toBeInTheDocument();
    await act(async () => { fireEvent.click(resendBtn); });
    expect(mockResendVerification).toHaveBeenCalledOnce();
    expect(screen.getByText('auth.verifyEmail.resendSuccess')).toBeInTheDocument();
  });

  it('should hide resend button after successful resend', async () => {
    mockEmailVerified = false;
    await act(async () => { render(<AppShell><span>x</span></AppShell>); });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'auth.verifyEmail.bannerAction' }));
    });
    expect(screen.queryByRole('button', { name: 'auth.verifyEmail.bannerAction' })).not.toBeInTheDocument();
  });
});
