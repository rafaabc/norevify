import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AppShell from '@/components/AppShell';

vi.mock('@/components/Sidebar.jsx', () => ({ default: ({ badgeCount }) => <div data-testid="sidebar" data-badge={badgeCount} /> }));
vi.mock('@/components/MobileTopBar.jsx', () => ({ default: ({ badgeCount }) => <div data-testid="mobile-top-bar" data-badge={badgeCount} /> }));
vi.mock('@/components/BottomTabs.jsx', () => ({ default: () => <div data-testid="bottom-tabs" /> }));
vi.mock('@/components/AppShell.module.css', () => ({ default: {} }));

const mockBadgeCount = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  remindersApi: { badgeCount: () => mockBadgeCount() },
}));

let mockIsAuthed = true;
vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ isAuthed: mockIsAuthed }),
}));

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthed = true;
    mockBadgeCount.mockResolvedValue({ dueSoon: 2, overdue: 1 });
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
});
