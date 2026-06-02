import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileTopBar from '@/components/MobileTopBar';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/components/MobileTopBar.module.css', () => ({ default: {} }));

const mockLogout = vi.fn();
vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

describe('MobileTopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render brand name', () => {
    render(<MobileTopBar />);
    expect(screen.getByText('NORE')).toBeInTheDocument();
  });

  it('should render reminders link', () => {
    render(<MobileTopBar />);
    expect(screen.getByRole('link', { name: 'nav.reminders' })).toHaveAttribute(
      'href',
      '/reminders',
    );
  });

  it('should not render badge when badgeCount is 0', () => {
    render(<MobileTopBar badgeCount={0} />);
    expect(screen.queryByText('0')).toBeNull();
  });

  it('should render badge count when badgeCount > 0', () => {
    render(<MobileTopBar badgeCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call logout when logout button clicked', () => {
    render(<MobileTopBar />);
    fireEvent.click(screen.getByRole('button', { name: 'nav.logout' }));
    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
