import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomTabs from '@/components/BottomTabs';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/components/BottomTabs.module.css', () => ({ default: {} }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => '/',
}));

describe('BottomTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('should render nav with main navigation label', () => {
    render(<BottomTabs />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('should render FAB add button', () => {
    render(<BottomTabs />);
    expect(screen.getByTestId('bottom-tabs-add')).toBeInTheDocument();
  });

  it('should open action sheet when FAB clicked', () => {
    render(<BottomTabs />);
    fireEvent.click(screen.getByTestId('bottom-tabs-add'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should close action sheet when cancel clicked', () => {
    render(<BottomTabs />);
    fireEvent.click(screen.getByTestId('bottom-tabs-add'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render dashboard and expenses tab links', () => {
    render(<BottomTabs />);
    expect(screen.getByRole('link', { name: /nav.dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nav.expenses/i })).toBeInTheDocument();
  });
});
